/**
 * list of events for websocket servers
 * @author hogfather
 * @date Jul 18, 2012 2:46:11 PM
 * @project JSLib
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, es5: true */
/*global define, d3, require, __dirname, process*/

define(function (require, exports, module) {
    "use strict";
    module.exports = {
        ConnectionOpened: "ConnectionOpened",
        ConnectionClosed: "ConnectionClosed",
        ConnectionTimedOut: "ConnectionTimedOut",
        UserAuthenticated: "UserAuthenticated",
        NoConnection: "NoConnection"
    };
});