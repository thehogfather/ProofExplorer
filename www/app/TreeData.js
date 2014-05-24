/**
 * Encapsulates the notion of a tree data. It starts with a root node and creates branches based on requests
 * @author Patrick Oladimeji
 * @date 4/21/14 14:15:55 PM
 */
/*jshint undef: true, unused: true*/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/
define(function (require, exports, module) {
    "use strict";
    var uuid = require("app/util/uuidGenerator"),
        deepCopy = require("app/deepcopy");
    
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
    
    /**
        A visitor function for all the nodes in the tree/subtree. The traversal halts only when all nodes in the tree have been exhausted.
        @param {function} f the function to call on the nodes in the tree
        @param {object} node the current node being traversed
        @param {Number} nodeIndex the index of the current node in the parent
        @param {object} parent the parent of the current node or null if this is the root node
        @param {function} childrenAccessor the function to use to get the children of a node
    */
    function visitAll(f, node, nodeIndex, parent, childrenAccessor) {
        childrenAccessor = childrenAccessor || function (d) { return d.children; };
        nodeIndex = [null, undefined].indexOf(nodeIndex) > -1 ? -1 : nodeIndex;//set nodeindex to -1 if it is undefined or null
        //visit the node and then its children
        f(node, nodeIndex, parent);
        var children = childrenAccessor(node);
        if (children) {
            children.forEach(function (c, i) {
                visitAll(f, c, i, node);
            });
        }
    }
    /**
        @returns {object} a deep copy of the subtree given
    */
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
        @param {object} root the root of the subtree where the search should start
        @param {function} comparator the function to use for testing that a node has been found
        @returns {?object} the found node or null
   
    */
    function find(root, comparator) {
        if (typeof comparator !== "function") { throw new Error("comparator argument should be a function"); }

        if (root) {
            if (comparator(root)) {
                return root;
            } else if (root.children && root.children.length) {
                var i, child, res;
                for (i = 0; i < root.children.length; i++) {
                    child = root.children[i];
                    res = find(child, comparator);
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
        Find the node with the give id using a depth first strategy.
        @param {object} root the root of the subtree where the search should start
        @param {function} comparator the function to use for testing that a node has been found
        @returns {?object} the found node or null
    */
    function findDFS(root, comparator) {
        if (typeof comparator !== "function") { throw new Error("comparator argument should be a function"); }
            
        if (root) {
            if (root.children && root.children.length) {
                var i, child, res;
                for (i = 0; i < root.children.length; i++) {
                    child = root.children[i];
                    res = findDFS(child, comparator);
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
    
    /**
        Calculates the depth of the subtree given
    */
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
    
    TreeData.prototype.find = function (subTree, f) {
        subTree = subTree || data;
        return find(subTree, f);
    };
    
    TreeData.prototype.findDFS = function (subTree, f) {
        subTree = subTree || data;
        return findDFS(subTree, f);
    };
    /**
        Copies the specified node
    */
    TreeData.copyTree = function (node) {
        return copyTree(node);
    };
    /**
        Removes the specified child node from the tree
        @param {object} child the child node to remove
    */
    TreeData.prototype.removeChild = function (child) {
        visit(function (node, nodeIndex, parent) {
            if (child.id === node.id && node !== data) {
                parent.children.splice(nodeIndex, 1);
                return true;
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
    
    module.exports = TreeData;
});