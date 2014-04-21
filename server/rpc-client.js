/**
 *
 * @author hogfather
 * @date Mar 9, 2012
 * @project JSLib
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */

(function () {
    "use strict";
    
    var xmlrpc = require("xmlrpc");
    var express = require("express"),
        server  = express();
    var port = 12345;

    var client = xmlrpc.createClient({host: "127.0.0.1", port: port, path: "/RPC2"});

    var test = {method: "info", id: new Date().getTime()};
    client.methodCall('pvs.request', [JSON.stringify(test), "http://localhost:12346/PVSResponse"], function (err, value) {
        if (err) {
            console.log(err);
        } else {
            console.log(value);
        }
    });
}());