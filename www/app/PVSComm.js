/**
 * Sends messages to the pvs server.
 * This module defines a generic function to send a prover command to the pvs server and a function to send a response back to the server when interactivity is expected e.g., responding to a confirmation dialog from pvs
 * @author Patrick Oladimeji
 * @date 4/22/14 12:22:13 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, Promise */
define(function (require, exports, module) {
    "use strict";
    var uuid = require("app/util/uuidGenerator"),
        WSClient = require("app/WebSocketClient");
    /**
        Sends a pvs command to the server. This is done over a websocket which connect
        to a local server which in turn manages connections to the PVS xmlRPC server.
        
        @params {object} comm a valid pvs prover command
        @returns {Promise} a promise that will resolve with the response from the server
        or an error object if there was a problem
    */
    function sendCommand(comm) {
        console.log(comm);
        return new Promise(function (resolve, reject) {
            WSClient.getInstance()
                .send({type: "PVSRequest", request: comm}, function (err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(JSON.parse(res.response));
                    }
                });
        });
    }
    /**
        SEnds a pvs response to the PVS server in response to an  interactive dialog initiated by the PVS server.
        This function does not wait for a response from the server and consequently resolves once the response
        has been sent over the websocket.
    */
    function sendResponse(res) {
        console.log(res);
        return new Promise(function (resolve) {
            res.type = "PVSResponse";
            WSClient.getInstance()
                .send(res);
            resolve("sent");
        });
    }
    /**
        utility function for sending a change context command to the server.
        @param {string} context a string representing the path to the folder to use as context of execution for PVS
        @returns {Promise} a promise that resolves when PVS server responds that the context has been set
    */
    function changeContext(context) {
        if (!context || typeof context !== "string") {
            return Promise.reject("context must be defined.");
        }
        var cmd = {method: "change-context", params: [context], id: uuid()};
        return new Promise(function (resolve, reject) {
            WSClient.getInstance()
                .send({type: "changecontext", request: cmd}, function (err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                });
        });
    }
    
    /**
        Typechecks the file specified. It is expected that this file is in the current context
        @param {string} file the name of the file to typecheck relative to the current context
        @returns {Promise} a promise that resolves with the result of the typecheck procedure
    */
    function typeCheck(file) {
        if (!file || typeof file !== "string") {
            return Promise.reject("file must be defined string");
        }
        var cmd = {method: "typecheck", params: [file], id: uuid()};
        return sendCommand(cmd);
    }
    
    module.exports = {
        sendCommand: sendCommand,
        changeContext: changeContext,
        typeCheck: typeCheck,
        sendResponse: sendResponse
    };
});
