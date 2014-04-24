/**
 * Encapsulates the notion of a tree data. It starts with a root node and creates branches based on requests
 * @author Patrick Oladimeji
 * @date 4/21/14 14:15:55 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    var uuid = require("app/util/uuidGenerator"),
        deepCopy = require("app/deepcopy"),
        treeGen = require("app/RandomTreeGenerator");
    
    var data, currentNode;
    
    /**
        A visitor function for all the nodes in the tree. If the function returns true, then the tree traversal will halt.
        @param f function to call on all nodes in the tree
        @param node the current node being traversed
        @param nodeIndex the index of the current node in the parent
        @param parent the parent of the current node or null of this is the root node
    */
    function visit(f, node, nodeIndex, parent) {
        nodeIndex = [null, undefined].indexOf(nodeIndex) > -1 ? -1 : nodeIndex;//set nodeindex to -1 if it is undefined or null
        var res = f(node, nodeIndex, parent);
        if (res) {
            return res;
        }
        if (node.children) {
            var i;
            for (i = 0; i < node.children.length; i++) {
                if (visit(f, node.children[i], i, parent)) {
                    break;
                }
            }
        }
    }
    
    function visitAll(f, node, nodeIndex, parent) {
        nodeIndex = [null, undefined].indexOf(nodeIndex) > -1 ? -1 : nodeIndex;//set nodeindex to -1 if it is undefined or null
        f(node, nodeIndex, parent);
        if (node.children) {
            node.children.forEach(function (c, i) {
                visitAll(f, c, i, node);
            });
        }
    }
    
    function copyTree(node) {
        var nodeCopy = deepCopy(node, "parent");
        nodeCopy.parent = node.parent;
        visitAll(function (n, ni, parent) {
            if (n) {
                n.id = uuid();
                n.parent = parent;
            }
        }, nodeCopy);
        return nodeCopy;
    }
    /**
        Find the node with the give id
    */
    function find(nodeid, root) {
        if (root) {
            if (root.id === nodeid) {
                return root;
            } else if (root.children && root.children.length) {
                var i, child, res;
                for (i = 0; i < root.children.length; i++) {
                    child = root.children[i];
                    res = find(nodeid, root.children[i]);
                    //break out of loop if we have found it
                    if (res) {
                        return res;
                    }
                }
            }
        }
        return null;
    }
    
    function depth(node) {
        if (!node || !node.children || !node.children.length) { return 1; }
        return 1 + node.children.map(function (c) {
            return 1 + depth(c);
        }).sort(function (a, b) {
            return b - a;//descending order
        })[0];
    }
    
    function TreeData(root) {
        root = root || "root";
        if (typeof root === "string") {
            root = {name: root};
        }
        //assign unique ids to the nodes if id not already a property
        visitAll(function (node) {
            node.id = node.id || uuid();
        }, root);
        data = currentNode = root;
    }
    
    TreeData.prototype.visitAll = function (f) {
        visitAll(f, data);
    };
    
    TreeData.prototype.depth = function () {
        return depth(data);
    };
    
    TreeData.prototype.find = function (node) {
        return find(node.id, data);
    };
    
    TreeData.copyTree = function (node) {
        return copyTree(node);
    };
    
    TreeData.prototype.removeChild = function (child) {
        visit(function (node, nodeIndex, parent) {
            if (child.id === node.id) {
                if (parent && parent.children) {
                    if (nodeIndex > -1) {
                        parent.children.splice(nodeIndex, 1);
                        return true;
                    }
                }
            }
        }, data);
    };
    
    TreeData.prototype.addChild = function (child, parent) {
        var parentId = typeof parent === "string" ? parent : typeof parent === "object" ? parent.id : null;
        var pNode;
        if (parentId) {
            pNode = find(parentId, data);
            child.id = child.id || uuid();
            pNode.children = pNode.children || [];
            
            pNode.children.push(child);
        } else {
            throw new Error("Unable to add a child to a null parent");
        }
        return this;
    };
    
    TreeData.prototype.getData = function () {
        return data;
    };
    
    TreeData.generateRandomChildren = function () {
        var res = treeGen.getTreeData(1, 5).children;
        res.forEach(function (n) {
            n.id = uuid();
        });
        return res;
    };

    module.exports = TreeData;
});
