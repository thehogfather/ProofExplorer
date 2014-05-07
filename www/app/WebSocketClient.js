/**
 * Websocket client for making connection to the pvs server
 * @author Patrick Oladimeji
 * @date 5/7/14 11:22:10 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    var wsBase = require("app/websockets/wsClient");
    var instance;
    module.exports = {
        getInstance: function () {
            if (!instance) {
                instance = wsBase();
            }
            return instance;
        }
    };
});
