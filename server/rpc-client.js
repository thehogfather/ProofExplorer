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
        http    = require("http"),
        util = require("util"),
        express = require("express"),
        bodyParser = require("body-parser"),
        logger = require("tracer").console(),
        fs = require("fs"),
        path = require("path"),
        ws = require("ws"),
        clientid = 0,
        clientSocket;
    
    var expressServer = express();//this is how the client sends messages to the PVS server
    expressServer.use(bodyParser());
    expressServer.use(express.static("../www"));
    
    var httpServer = http.createServer(expressServer);
    //declare hosts and ports
    var pvsHost = "172.16.63.131",// "192.168.1.100",
        pvsPort = 22334,
        xmlRPCRequestPath = "/RPC2",
        callbackHost = "172.16.63.1",//"192.168.1.98" ,
        callbackPort = 12346;
    
   
    var WebSocketServer = ws.Server;
    
    var wss = new WebSocketServer({server: httpServer});
    var server = xmlrpc.createServer({host: callbackHost, port: callbackPort});
    var cbUrl = util.format("http://%s:%d", callbackHost, callbackPort);
    
    var client = xmlrpc.createClient({host: pvsHost, port: pvsPort, path: xmlRPCRequestPath});
    var callbackMap = {};
    
     /**
     * Get the stat for the file in the specified path
     * @returns {Promise} a promise that resolves with the stat object of the file
      see http://nodejs.org/api/fs.html#fs_class_fs_stats for details
     */
    function stat(fullPath) {
        return new Promise(function (resolve, reject) {
            fs.stat(fullPath, function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
    /**
        Recursively reads the files in a directory using promises
        @param {string} fullPath the path to the directory to read
        @param {boolean} getContent a flag to set whehter or not to return the content of the file
        @returns {Promise} a promise that resolves with an array of objects  for the files in the given directory.
            The object may contain just filePath prooperties or may include fileContent if the getContent parameter was passed
    */
    function getFilesInDirectory(fullPath, getContent) {
        return stat(fullPath).then(function (f) {
            if (f.isDirectory()) {
                return new Promise(function (resolve, reject) {
                    fs.readdir(fullPath, function (err, files) {
                        if (err) {
                            reject(err);
                        } else {
                            var promises = files.map(function (name) {
                                var filePath = path.join(fullPath, name);
                                return getFilesInDirectory(filePath, getContent);
                            });

                            Promise.all(promises)
                                .then(function (res) {
                                    var flattened = res.reduce(function (a, b) {
                                        if (Array.isArray(b)) {
                                            return a.concat(b);
                                        } else {
                                            a.push(b);
                                            return a;
                                        }
                                    }, []);
                                    resolve(flattened);
                                }, reject);
                        }
                    });
                });
            } else {
                if (!getContent) {
                    return Promise.resolve({filePath: fullPath});
                }
                //resolve with the filename and content
                return new Promise(function (resolve, reject) {
                    fs.readFile(fullPath, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({filePath: fullPath, fileContent: data});
                        }
                    });
                });
            }
        }, function (err) {
            return Promise.reject(err);
        });
    }
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
        
        socket.on("close", function (e) {
            logger.log("closing websocket client %d", clientid);
        });
    });
    
    wss.on("error", function (err) {
        logger.log(err);
    });
    httpServer.listen(8083);
    logger.log("pvs proxy listening on 8083");
}());