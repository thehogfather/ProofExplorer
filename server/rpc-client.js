/**
 *
 * @author hogfather
 * @date Mar 9, 2012
 * @project JSLib
 */
/*jshint unused: true*/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global  require, __dirname */

(function () {
    "use strict";
    //declare required libraries
    var xmlrpc = require("xmlrpc"),
        Promise = require("es6-promise").Promise,
        http    = require("http"),
        util = require("util"),
        express = require("express"),
        bodyParser = require("body-parser"),
        logger = require("tracer").console(),
        FileUtil = require("./fileutil"),
        path = require("path"),
        ws = require("ws"),
        clientid = 0,
        clientSocket;
    
    var expressServer = express();//this is how the client sends messages to the PVS server
    expressServer.use(bodyParser());
    expressServer.use(express.static("../www"));
    
    var httpServer = http.createServer(expressServer);
    //declare hosts and ports
    var pvsHost = "localhost",
        pvsPort = 22334,
        xmlRPCRequestPath = "/RPC2",
        callbackHost = "localhost",
        callbackPort = 12346;
    
   
    var WebSocketServer = ws.Server;
    
    var wss = new WebSocketServer({server: httpServer});
    var server = xmlrpc.createServer({host: callbackHost, port: callbackPort});
    var cbUrl = util.format("http://%s:%d", callbackHost, callbackPort);
    
    var client = xmlrpc.createClient({host: pvsHost, port: pvsPort, path: xmlRPCRequestPath});
    var callbackMap = {};
    
    /**
     Sends a special token to the websocket client to signify that an interactive response is required.
     The result of this should have a type "PVSResponse so that the server can invoke the appropriate xmlrpc
     callback function based on the id of the response
    */
    function processClientDialog(socket, data, rpcCb) {
        callbackMap[data.id] = rpcCb;
        socket.send(JSON.stringify({id: data.id, response: data, type: "interactive"}));
    }
    
     ///define websocket handlers
    function processCallback(token, socket) {
        socket.send(JSON.stringify(token));
    }
    
    server.on("request", function (err, params, callback) {
        if (err) {
            logger.log("error");
            logger.log(err);
        } else {
            var data = JSON.parse(params);
            if (!data.jsonrpc_result) {
                switch (data.method) {
                case "yes_no":
                case "dialog":
                    logger.log(data);
                    processClientDialog(clientSocket, data, callback);
                    break;
                default:
                    logger.log(data);
                    data.type = data.method;
                    processCallback(data, clientSocket);
                    callback(null);
                }
            } else {
                callback(null);
            }
        }
    });
    
    function makePVSRequest(request) {
        logger.log("Sending request " + JSON.stringify(request));
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
        
    function clientWebSocketFunctions() {
        return {
            "readDirectory": function (token, socket) {
                FileUtil.readDirectory(token.filePath)
                    .then(function (files) {
                        processCallback({id: token.id, files: files}, socket);
                    }, function (err) {
                        processCallback({id: token.id, err: err}, socket);
                    });
            },
            "changecontext": function (token, socket) {
                token.request.params[0] = path.resolve(__dirname, token.request.params[0]);
                var context = token.request.params[0];
                makePVSRequest(token.request)
                    .then(function (res) {
                        //fetch the files/folders in the directory
                        FileUtil.getFilesInDirectory(context)
                        .then(function (files) {
                            //filter files to only contain pvs files and ensure paths returned are relative to context
                            var pvsFiles = files.filter(function (f) {
                                return path.extname(f.filePath) === ".pvs";
                            }).map(function (f) { return path.relative(context, f.filePath); });
                            
                            processCallback({id: token.id, files: pvsFiles, response: res}, socket);
                        }, function (err) {
                            processCallback({id: token.id, err: err}, socket);
                        });
                    }, function (err) {
                        processCallback({id: token.id, err: err}, socket);
                    });
            },
            "PVSRequest": function (token, socket, socketid) {
                makePVSRequest(token.request)
                    .then(function (res) {
                        processCallback({id: token.id, response: res}, socket);
                    }, function (err) {
                        processCallback({id: token.id, err: err}, socket);
                    });
            },
            "PVSResponse": function (token, socket, socketid) {
                var cb = callbackMap[token.id];
                if (cb && typeof cb === "function") {
                    cb(null, JSON.stringify(token.response));
                }
            }
        };
    }
    
    wss.on("connection", function (socket) {
        var socketid = ++clientid;
        var functions = clientWebSocketFunctions();
        if (clientSocket) {
            //maybe close any previous client socket connections?
            clientSocket.close();
        }
        clientSocket = socket;
        socket.on("message", function (m, flags) {
            if (!flags.binary) {
                //parse and maybe validate the json string here
                var token = JSON.parse(m);
                var f = functions[token.type];
                if (f && typeof f === "function") {
                    f(token, socket, socketid);
                }
            } else {
                logger.error("Websocket messages should be strings");
            }
        });
        
        socket.on("close", function () {
            logger.log("closing websocket client %d", clientid);
        });
    });
    
    wss.on("error", function (err) {
        logger.log(err);
    });
    httpServer.listen(8083);
    logger.log("pvs proxy listening on 8083");
}());