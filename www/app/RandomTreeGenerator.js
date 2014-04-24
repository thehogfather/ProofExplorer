/**
 * Demostration of proof tree interaction and visualisation (concept)
 * @author Patrick Oladimeji
 * @date 4/9/14 9:37:37 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    
    var d3 = require("d3"),
        uuid = require("app/util/uuidGenerator");
    var alphabet = "abcdefghijklmnopqrstuvwxyz";
    
    function word() {
        var len = Math.ceil(Math.random() * 8), i, res = [], index;
        for (i = 0; i < len; i++) {
            index = Math.ceil(Math.random() * alphabet.length - 1);
            res.push(alphabet[index]);
        }
        return res.join("");
    }
    
    function randDescription() {
        var len = Math.ceil(Math.random() * 10), i, res = [];
        for (i = 0; i < len; i++) {
            res.push(word());
        }
        return res.join(" ");
    }
    
    function getTreeData(depth, numChildren) {
        depth = depth === undefined ? 4 : depth;
        numChildren = numChildren === undefined ? 3 : numChildren;
        
        function t(depth, node) {
            if (depth === 0) {
                return node;
            } else {
                var n = Math.ceil(Math.random() * numChildren);
                var children = d3.range(0, n).map(function (d) {
                    return t(depth - 1, {name: "child", description: randDescription()});
                });
                
                node.children = children;
                return node;
            }
        }
        
        return t(depth, {name: "root", description: randDescription()});
    }
    
    module.exports = {
        getTreeData: getTreeData,
        generateRandomChildren : function (n) {
            n = isNaN(n) ? 3 : n;
            var res = getTreeData(1, n).children;
            res.forEach(function (c) {
                c.id = uuid();
            });
            return res;
        }
    };
});
