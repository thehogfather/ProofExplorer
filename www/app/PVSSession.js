/**
 * Manages a session of theorem proving on pvs.
 * @author Patrick Oladimeji
 * @date 4/24/14 11:18:36 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Promise */
define(function (require, exports, module) {
    "use strict";
    var comm = require("app/PVSComm"),
        TreeData = require("app/TreeData"),
        eventDispatcher = require("app/util/eventDispatcher");
    
    var currentState, proofTree, allStates, ps;
    
    /**
        sets the active node in the tree
    */
    function setActiveNode(state, tree) {
        //only one active node is allowed on the tree
        tree.visitAll(function (node) {
            node.active = null;
        });
        var node = tree.find(state.label);
        if (node) {
            node.active = true;
        }
    }
    
    /**
        This function inspects the oldstate and enw state name and adds new children
        to the tree if needed. E.g., if old state was test and we are in a new state test.1
        which has 4 subgoals, then we need to create all subgoals as children in the node
        pointed to by the parent if they dont already exist
    */
    function updateTree(tree, oldState, newState) {
        var children, i, numSubgoals, id, newStateIndex, parent;
        if (newState.label.indexOf(oldState.label) === 0) {
            if (!allStates[newState.label]) {
                //create all the subgoal children 
                children = [];
                numSubgoals = newState["num-subgoals"];
                for (i = 1; i <= numSubgoals; i++) {
                    id = oldState.label + "." + i;
                    children.push({id: id, name: id});
                }
                //add generated children to tree
                parent = tree.find(oldState.label);
                if (parent) {
                    parent.children = children;
                } else {console.error("could not find parent"); }
            }
            //so we have seen this state before or at least we have created a node for it so just update the node status
            //probably just done a postpone
            setActiveNode(newState, tree);
        } else {
            //new state is not a descendant so maybe we have just done postpones
            setActiveNode(newState, tree);
        }
    }
    
    function PVSSession() {
        eventDispatcher(this);//enable session object to dispatch events
        allStates = {};
        ps = this;
    }
    
    PVSSession.prototype.updateCurrentState = function (res) {
        var s = res.jsonrpc_result.result.label, previousState = currentState;
        if (s !== currentState) {
            currentState = s;
            allStates[currentState] = new Date().getTime();
            updateTree(proofTree, previousState, currentState);
            this.fire({type: "statechanged", state: s, previous: previousState, tree: proofTree});
        }
        return Promise.resolve(res);
    };
    
    /**
     Initiates a pvs session with the server
    */
    PVSSession.prototype.begin = function (context, file) {
        return comm.changeContext(context)
            .then(function (res) {
                //maybe do something with res and then typecheck
                return comm.typeCheck(file);
            });
    };
    
    /**
        Sends a request to proove a formula in the given theory file
    */
    PVSSession.prototype.prooveFormula = function (formula, theory) {
        var ps = this;
        return comm.sendCommand({method: "prove-formula", params: [formula, theory]})
            .then(ps.updateCurrentState)
            .then(function (res) {
                proofTree = new TreeData({id: currentState, name: currentState});
                ps.fire({type: "treechanged", tree: proofTree});
                return Promise.resolve(res);
            });
    };
    
    
    PVSSession.prototype.sendCommand = function (command) {
        var ps = this;
        return comm.sendCommand(command)
            .then(ps.updateCurrentState);
    };
    
    PVSSession.prototype.postpone = function () {
        var ps = this;
        return comm.sendCommand({method: "proof-command", params: ["(postpone)"]})
            .then(ps.updateCurrentState);
    };
                  
    
    module.exports = PVSSession;
});
