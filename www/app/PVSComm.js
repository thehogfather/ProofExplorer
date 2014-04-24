/**
 * Sends messages to the pvs server
 * @author Patrick Oladimeji
 * @date 4/22/14 12:22:13 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Promise */
define(function (require, exports, module) {
    "use strict";
    var server = "http://localhost:8083/pvs",
        d3 = require("d3"),
        uuid = require("app/util/uuidGenerator");
    
    function sendCommand(comm) {
        console.log(comm);
        return new Promise(function (resolve, reject) {
            d3.json(server)
                .header("Content-Type", "application/json")
                .post(JSON.stringify(comm), function (err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                });
        });
    }
    
    function changeContext(context) {
        if (!context || typeof context !== "string") {
            return Promise.reject("context must be defined.");
        }
        var cmd = {method: "change-context", params: [context], id: uuid()};
        return sendCommand(cmd);
    }
    
    /**
        Typechecks the file specified. It is expected that this file is in the current context
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
        typeCheck: typeCheck
    };
});
