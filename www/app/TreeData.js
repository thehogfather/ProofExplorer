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
        @param childrenAccessor a function to use to get the children of the nodes
    */
    function visit(f, node, nodeIndex, parent, childrenAccessor) {
        childrenAccessor = childrenAccessor || function (d) { return d.children; };
        nodeIndex = [null, undefined].indexOf(nodeIndex) > -1 ? -1 : nodeIndex;//set nodeindex to -1 if it is undefined or null
        var res = f(node, nodeIndex, parent);
        if (res) {
            return res;
        }
        var i, children = childrenAccessor(node);
        if (children) {
            for (i = 0; i < children.length; i++) {
                res = visit(f, children[i], i, parent, childrenAccessor);
                if (res) {
                    return res;
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
        Find the node with the give id using breadth first strategy
    */
    function find(nodeid, root, comparator) {
        comparator = comparator || function (currentNode) { return nodeid === currentNode.id; };
        if (root) {
            if (comparator(root)) {
                return root;
            } else if (root.children && root.children.length) {
                var i, child, res;
                for (i = 0; i < root.children.length; i++) {
                    child = root.children[i];
                    res = find(nodeid, root.children[i], comparator);
                    //break out of loop if we have found it
                    if (res) {
                        return res;
                    }
                }
            }
        }
        return null;
    }
    
    /**
        Find the node with the give id using a depth first strategy
    */
    function findDFS(nodeid, root, comparator) {
        comparator = comparator || function (currentNode) { return nodeid === currentNode.id; };
        if (root) {
            if (root.children && root.children.length) {
                var i, child, res;
                for (i = 0; i < root.children.length; i++) {
                    child = root.children[i];
                    res = findDFS(nodeid, root.children[i], comparator);
                    //break out of loop if we have found it
                    if (res) {
                        return res;
                    }
                }
            }
            
            if (comparator(root)) {
                return root;
            }
        }
        return null;
    }
    
    function leafIndex(leaf, root, count) {
        var i, child, res;
        count = count || 0;
        res = {index: count};
        for (i = 0; i < root.children.length; i++) {
            child = root.children[i];
            if (child.children) {
                res = leafIndex(leaf, child, res.index);
                if (res.found) {
                    return res;
                }
            } else {
                res.index += 1;
                if (leaf.id === child.id) {
                    res.found = true;
                    return res;
                }
            }
        }
        
        return res;
        
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
    
    TreeData.visit = visit;
    
    TreeData.visitAll = function (f, node) {
        visitAll(f, node);
    };
    
    TreeData.prototype.visitAll = function (f) {
        visitAll(f, data);
    };
    
    TreeData.prototype.depth = function () {
        return depth(data);
    };
    
    TreeData.prototype.find = function (id, subTree, f) {
        subTree = subTree || data;
        return find(id, subTree, f);
    };
    
    TreeData.prototype.findDFS = function (id, subTree, f) {
        subTree = subTree || data;
        return findDFS(id, subTree, f);
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
    
    TreeData.prototype.leafWalk = function (from, to) {
        var lastChildIndex = leafIndex(data.children[data.children.length - 1], data);
        var f = leafIndex(from, data),
            t = leafIndex(to, data);
        var dist = t.index - f.index;
        if (dist < 0) {
            dist = dist + lastChildIndex.index + 1;
        }
        return dist;
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
