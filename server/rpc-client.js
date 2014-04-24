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
    //declare required libraries
    var xmlrpc = require("xmlrpc"),
        Promise = require("es6-promise").Promise,
        util = require("util"),
        express = require("express"),
        bodyParser = require("body-parser");
    
    var clientPVSProxy = express();//this is how the client sends messages to the PVS server
    clientPVSProxy.use(bodyParser());
    //declare hosts and ports
    var pvsHost = "172.16.62.216",
        pvsPort = 12345,
        xmlRPCRequestPath = "/RPC2",
        callbackHost = "130.107.98.54",
        callbackPort = 12346;
    
   
    
    var server = xmlrpc.createServer({host: callbackHost, port: callbackPort});
    var cbUrl = util.format("http://%s:%d", callbackHost, callbackPort);
    
    var client = xmlrpc.createClient({host: pvsHost, port: pvsPort, path: xmlRPCRequestPath});

    server.on("request", function (err, params, callback) {
        if (err) {
            console.log("error");
            console.log(err);
        } else {
            console.log(params);
            callback(null, params);
        }
    });
    
    function makePVSRequest(request) {
        console.log("Sending request " + JSON.stringify(request));
        request.id = request.id || new Date().getTime();
        var p = new Promise(function (resolve, reject) {
            client.methodCall("pvs.request", [JSON.stringify(request), cbUrl], function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    res = JSON.parse(res);
                    resolve(JSON.stringify(res, null, " "));
                }
            });
        });
        
        return p;
    }
    
    
    clientPVSProxy.all("/pvs", function (req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        console.log(req.body);
        makePVSRequest(req.body)
            .then(function (pvsres) {
                res.send(pvsres);
            });
    });
    
    clientPVSProxy.listen(8083);
    console.log("pvs proxy listening on 8083");
}());