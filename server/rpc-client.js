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
        util = require("util");
    
    //declare hosts and ports
    var pvsHost = "localhost",
        pvsPort = 12345,
        xmlRPCRequestPath = "/RPC2",
        callbackHost = "localhost",
        callbackPort = 12346;
    
    //declare list of proof commands
    var grind = "(grind)",
        skosimp_star = "(skosimp*)",
        assert = "(assert)";
    
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
        
    function proofCommand(command) {
        return {method: "proof-command", params: [command]};
    }
        
    var examples = "/home/chimed/pvs-github/ProofExplorer/examples";
    var changeContext = {method: "change-context", params: [examples], id: new Date().getTime()},
        typeCheck = {method: "typecheck", params: ["predictability_th"]},
        proveFormula = {method: "prove-formula", params: ["dn_button_predictable", "predictability_th"]},
        grindCommand = proofCommand(grind);
    
    makePVSRequest(changeContext)
        .then(function (res) {
            console.log(res);
            return makePVSRequest(typeCheck);
        }, function (err) {
            console.log(err);
        }).then(function (res) {
            console.log(res);
            return makePVSRequest(proveFormula);
        }, function (err) {
            console.log(err);
        }).then(function (res) {
            console.log(res);
            return makePVSRequest(grindCommand);
        }).then(function (res) {
            console.log(res);
        });
}());