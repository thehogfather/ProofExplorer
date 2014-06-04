/**
 * Manages rendering the treeview for a remote file system
 * @author Patrick Oladimeji
 * @date 6/2/14 23:28:54 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";

    var eventDispatcher = require("app/util/eventDispatcher"),
        ws = require("app/WebSocketClient").getInstance(),
        TreeList = require("./TreeList"),
        initialPath,
        treeList,
        el;
    
    function fileFilter(f) {
        return f.name.indexOf(".") !== 0;    
    }
    
    function RemoteFileBrowser(_path, _el) {
        eventDispatcher(this);
        initialPath = _path;
        el = _el;
        this.reBase(initialPath);
    }
    
    RemoteFileBrowser.prototype.reBase = function (path) {
        var rfb = this;
        ws.send({type: "readDirectory", filePath: path}, function (err, res) {
            if (!err) {
                var data = {name: path, path: path, children: res.files.filter(fileFilter), isDirectory: true};
                treeList = new TreeList(data, el);
                treeList.addListener("SelectedItemChanged", function (event) {
                    var data = event.data;
                    if (data.isDirectory && !data.children && !data._children) {
                        rfb.getRemoteDir(data.path)
                            .then(function (files) {
                                data.children = files;
                                treeList.render(data);
                            }, function (err) {
                                console.log(err);
                            });
                    }
                });
            }
        });
    };
    
    RemoteFileBrowser.prototype.getRemoteDir = function (path) {
        //maybe there is a way to make this more efficient?
        return new Promise(function (resolve, reject) {
            ws.send({type: "readDirectory", filePath: path}, function (err, contents) {
                if (!err) {
                    resolve(contents.files.filter(fileFilter));
                } else {
                    reject(err);
                }
            });
        });
    };
    
    RemoteFileBrowser.prototype.getSelectedFile = function () {
        return treeList.getSelectedItem();
    };
    
    module.exports = RemoteFileBrowser;
});
