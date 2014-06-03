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
        treeList;
    function RemoteFileBrowser(_path, el) {
        eventDispatcher(this);
        initialPath = _path;
        var rfb = this;
        
        ws.send({type: "readDirectory", filePath: initialPath}, function (err, res) {
            if (!err) {
                var data = {name: initialPath, path: initialPath, children: res.files, isDirectory: true};
                treeList = new TreeList(data, el);
                treeList.addListener("SelectedItemChanged", function (event) {
                    var data = event.data;
                    rfb.getRemoteDir(data);
                });
            }
        });
    }
    
    RemoteFileBrowser.prototype.getRemoteDir = function (selectedItem) {
        //maybe there is a way to make this more efficient?
        if (selectedItem.isDirectory && !selectedItem.children && !selectedItem._children) {
            ws.send({type: "readDirectory", filePath: selectedItem.path}, function (err, contents) {
                if (!err) {
                    selectedItem.children = contents.files;
                    treeList.render(selectedItem);
                }
            });
        }
    };
    
    RemoteFileBrowser.prototype.getSelectedFile = function () {
        return treeList.getSelectedItem();
    };
    
    module.exports = RemoteFileBrowser;
});
