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
    
    var currentState, proofTree, allStates, ps, activeState;
   
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
            activeState = node;
        }
    }
    
    /**
        This function inspects the oldstate and new state name and adds new children
        to the tree if needed. E.g., if old state was test and we are in a new state test.1
        which has 4 subgoals, then we need to create all subgoals as children in the node
        pointed to by the parent if they dont already exist
        Also we check if we have just transitioned from a child node to a parent node (e.g. after an (undo))
        If this is the case, we need to clear the children of the current node
    */
    function updateTree(tree, oldState, newState) {
        var children, i, numSubgoals, id, newStateIndex, parent, state;
        if (oldState && newState.label !== oldState.label && newState.label.indexOf(oldState.label) === 0) {//new state is a child of oldstate
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
                } else {console.log("could not find parent"); }
            }
            //so we have seen this state before or at least we have created a node for it so just update the node status
            //probably just done a postpone
            setActiveNode(newState, tree);
        } else if (oldState && oldState.label !== newState.label && oldState.label.indexOf(newState.label) === 0) {//new state is a parent of oldstate
            state = tree.find(newState.label);
            if (state) {
                //visit the nodes and descendants and remove them from allSates
                TreeData.visitAll(function (node) {
                    delete allStates[node.id];
                }, state);
                delete state.children;
                delete state.command;
            }
            setActiveNode(newState, tree);
        } else if (oldState && oldState.label === newState.label) {
            //create a branch anyway to show that a command has been added to the parent
            state = tree.find(oldState.label);
            if (state) {
                state.id = state.id + ".0";
                state.children = [{id: newState.label, name: newState.label}];
            }
            setActiveNode(newState, tree);
        } else {
            //new state is not a descendant so maybe we have just done postpones
            setActiveNode(newState, tree);
        }
    }
    /**
     The state is unchanged iff any one of the conditions below hold
        1. it is explicitly set in the commentary that it is unchanged
        2. it is a postponed state
        and
        3. its label is the same as the label of the previous state
    */
    function stateUnchanged(state, previousState) {
        return state.label === previousState.label && state.commentary ? state.commentary.some(function (comment) {
            return comment.trim().toLowerCase().indexOf("no change on") === 0 || comment.trim().toLowerCase().indexOf("postponing") === 0;
        }) : false;
    }
    
    function PVSSession() {
        eventDispatcher(this);//enable session object to dispatch events
        allStates = {};
        ps = this;
    }
    /**
         Updates the current state using the data from the pvsresponse 
    */
    PVSSession.prototype.updateCurrentState = function (res) {
        var s = res.jsonrpc_result.result, previousState = currentState, ps = this;
        if (stateUnchanged(s, previousState)) {
            ps.fire({type: "stateunchanged", state: currentState, tree: proofTree});
        } else {//if (!currentState || s.label !== currentState.label) {
            currentState = s;
            updateTree(proofTree, previousState, currentState);
            allStates[currentState.label] = new Date().getTime();
            ps.fire({type: "statechanged", state: s, previous: previousState, tree: proofTree});
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
    PVSSession.prototype.proveFormula = function (formula, theory) {
        var ps = this;
        return comm.sendCommand({method: "prove-formula", params: [formula, theory]})
            .then(function (res) {
                currentState = res.jsonrpc_result.result;
                allStates[currentState.label] = new Date().getTime();
                proofTree = new TreeData({id: currentState.label, name: currentState.label});
                setActiveNode(currentState, proofTree);
                ps.fire({type: "treecreated", tree: proofTree});
                return Promise.resolve(res);
            });
    };
    
    
    PVSSession.prototype.sendCommand = function (command) {
        var ps = this;
        return comm.sendCommand(command)
            .then(function (res) {
                return ps.updateCurrentState(res);
            });
    };
    
    PVSSession.prototype.postpone = function () {
        var ps = this;
        return comm.sendCommand({method: "proof-command", params: ["(postpone)"]})
            .then(function (res) {
                return ps.updateCurrentState(res);
            });
    };
    
    PVSSession.prototype.postponeUntil = function (targetId) {
        var ps = this, currentlyActiveId = activeState.id;
        function postpone() {
            return comm.sendCommand({method: "proof-command", params: ["(postpone)"]})
                .then(function (res) {
                    if (res.jsonrpc_result.result.label === targetId || res.jsonrpc_result.result.label === currentlyActiveId) {
                        return ps.updateCurrentState(res);
                    } else {
                        return postpone();
                    }
                });
        }
        if (targetId === currentlyActiveId) {
            return Promise.resolve(true);
        } else {
            return postpone();
        }
    };
    
    module.exports = PVSSession;
});
