/**
 * 
 * @author Patrick Oladimeji
 * @date 4/17/14 8:57:35 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, confirm */
define(function (require, exports, module) {
    "use strict";
    
    var comm = require("app/PVSComm");
    var UI       = require("app/UserInterface"),
        WSClient = require("app/WebSocketClient"),
        ConsoleLogger = require("app/util/ConsoleLogger");
    
    var wsc = WSClient.getInstance();
    
    function log(obj) {
        ConsoleLogger.log(obj);
    }
    
    wsc.url("ws://" + location.host)
        .logon()
        .then(function () {
            UI.createUI();
            wsc.addListener("interactive", function (event) {
                var ok = confirm(event.response.params[0]);
                var response = {
                    id: event.response.id,
                    response: {
                        jsonrpc_result: {id: event.response.id, jsonrpc: event.response.jsonrpc, result: ok ? "yes" : "no"}
                    }
                };
                //send back a pvs response message
                comm.sendResponse(response);
            }).addListener("info", log)
               // .addListener("buffer", log)
                .addListener("warning", log)
                .addListener("debug", log);
        });

});
