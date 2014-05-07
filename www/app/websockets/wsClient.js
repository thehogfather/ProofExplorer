/**
 * Generic websocket client that is able to listen to messages and handle specific results from
 * server function call
 * @author Patrick Oladimeji
 * @date 6/4/13 18:50:25 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent, WebSocket, Promise*/
define(function (require, exports, module) {
    "use strict";
    var property = require("app/util/property"),
        eventDispatcher = require("app/util/eventDispatcher"),
        uuid        = require("app/util/uuidGenerator"),
        events      = require("app/websockets/events");
    
    module.exports = function () {
        var o = eventDispatcher({}), ws, callbackRegistry = {};
        o.url = property.call(o, "ws://localhost");
		o.port = property.call(o);
        /**
         * Attempts to logon to the websocket server
         * returns a promise that resolves when the connection has been opened
         */
        o.logon = function () {
            if (!ws) {
				var wsUrl = o.url();
				if (o.port()) { wsUrl = wsUrl + ":" + o.port(); }
                return new Promise(function (resolve, reject) {
                    ws = new WebSocket(wsUrl);
                    ws.onopen = function (event) {
                        o.fire({type: events.ConnectionOpened, event: event});
                        resolve(ws);
                    };
                    ws.onerror = function (event) {
                        reject(event);
                    };
                    ws.onclose = function (event) {
                        o.fire({type: events.ConnectionClosed, event: event});
                    };
                    //when a message is received, look for the callback for that message id in the callbackRegistry
                    //if no callback exists then broadcast the event using the token type string
                    ws.onmessage = function (event) {
                        var token = JSON.parse(event.data);
                        //if token has an id check if there is a function to be called in the registry
                        if (token.id && typeof callbackRegistry[token.id] === "function") {
                            var f = callbackRegistry[token.id];
                            delete callbackRegistry[token.id];
                            f.call(o, token.err, token);
                        } else if (token.type) {
                            o.fire(token);
                        }
                    };
                });
               
            } else {
                return Promise.resolve(ws);
            }
        };
        /**
         * sends a message and register a callback to invoke when the message response is received from the server.
         */
        o.send = function (token, cb) {
            var id = uuid();
            if (token && token.type) {
                token.id = token.id || id;
                token.sent = new Date().getTime();
                callbackRegistry[id] = cb;
                ws.send(JSON.stringify(token));
            } else {
                console.log("Token is undefined");
            }
            return o;
        };
        /**
            closes the websocket connection
        */
        o.close = function () {
            if (ws) {
                ws.close();
            }
        };
        
        return o;
    };
});