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
        d3 = require("d3");
    
    function sendCommand(comm) {
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
    
    module.exports = {
        sendCommand: sendCommand
    };
});
