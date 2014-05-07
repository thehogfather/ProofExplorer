/**
 * 
 * @author Patrick Oladimeji
 * @date 4/17/14 8:57:35 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, prompt, confirm */
define(function (require, exports, module) {
    "use strict";
    
    var comm = require("app/PVSComm");
    var UI       = require("app/UserInterface"),
        PVSSession = require("app/PVSSession"),
        WSClient = require("app/WebSocketClient");
    
    var wsc = WSClient.getInstance();
    wsc.url("ws://localhost:8083")
        .logon()
        .then(function (ws) {
            UI.createUI();
            wsc.addListener("interactive", function (event) {
                var ok = confirm(event.response.params[0]);
                var response = {id: event.response.id, response: {jsonrpc_result: {id: event.response.id, jsonrpc: event.response.jsonrpc, result: ok ? "yes" : "no"}}};
                //send back a pvs response message
                comm.sendResponse(response);
            });
        });

});
