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
    var Promise = require("es6-promise").Promise;
    var express = require("express");
    var port = 12345;
    
    var server = xmlrpc.createServer({host: "192.168.1.98", port: port});
    
    server.on("request", function (err, params, callback) {
        if (err) {
            console.log("error");
            console.log(err);
        } else {
            console.log("inside server");
            console.log(params);
            callback(params);
        }
    });
    
    var cbUrl = "http://192.168.1.98:12345";
    var client = xmlrpc.createClient({host: "192.168.1.100", port: port, path: "/RPC2"});

    function makePVSRequest(request) {
        console.log("Sending request " + JSON.stringify(request));
        request.id = request.id || new Date().getTime();
        var p = new Promise(function (resolve, reject) {
            client.methodCall("pvs.request", [JSON.stringify(request), cbUrl], function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    console.log("so I got a response back");
                    res = JSON.parse(res);
                    resolve(res);
                }
            });
        });
        
        return p;
    }
        
    var examples = "/home/chimed/pvs-github/PVS/Examples";
    var changeContext = {method: "change-context", params: [examples], id: new Date().getTime()},
        typeCheck = {method: "typecheck", params: ["ackerman"]};
    
    makePVSRequest(changeContext)
        .then(function (res) {
            console.log(res);
            return makePVSRequest(typeCheck);
        }).then(function (res) {
            console.log(res);
        }, function (err) {
            console.log(err);
        });
}());