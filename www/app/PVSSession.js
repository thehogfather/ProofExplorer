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
    Currently this is a hack to detect uniqueness between states returned from the pvs server
    This function should be replaced immediately Sam updates the API with a field that denotes the sequent number
    */
    function sequentString(state) {
        var antecedents = (state.sequent && state.sequent.antecedents) || [],
            succedents = (state.sequent && state.sequent.succedents) || [];
        return antecedents.map(function (d) {return d.formula; }).join("").concat(succedents.map(function (d) {return d.formula; }).join(""));
    }

    function anySequentChanged(state) {
        var antecedents = (state.sequent && state.sequent.antecedents) || [],
            succedents = (state.sequent && state.sequent.succedents) || [];
        return antecedents.some(function (d) {
            return d.changed === "true";
        }) || succedents.some(function (d) {
            return d.changed === "true";
        });
    }
    
    function nodeSearch(nodeid) {
        return function (node) {
            return nodeid === node.id || nodeid === node.name;
        };
    }
    /**
        sets the active node in the tree
    */
    function setActiveNode(stateid, tree) {
        //only one active node is allowed on the tree
        tree.visitAll(function (node) {
            node.active = null;
        });
        var node = tree.findDFS(null, nodeSearch(stateid));
        if (node) {
            node.active = true;
            activeState = node;
            activeState.data = currentState;
            if (!activeState.formula) {
                activeState.formula = sequentString(currentState);
            }
        }
    }
    
    function isChild(child, parent) {
        return parent !== child && child.indexOf(parent) === 0;
    }
    
    function isParent(parent, child) {
        return parent !== child && child.indexOf(parent) === 0;
    }
    
    function levelUp(s) {
        return s.substring(0, s.lastIndexOf("."));
    }
    
    function areSiblings(child1, child2) {
        return levelUp(child1) === levelUp(child2);
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
       
        var children, i, numSubgoals, id, newStateIndex, parent, state, childState;
        
        function removeChildren(stateName) {
            var state = tree.findDFS(null, nodeSearch(stateName));
            if (state) {
                //visit the nodes and descendants and remove them from allSates
                TreeData.visitAll(function (node) {
                    delete allStates[node.id];
                }, state);
                delete state.children;
                delete state.command;
            }
            return state;
        }
        
        if (oldState && isChild(newState.label, oldState.label)) {//new state is a child of oldstate
            if (!allStates[newState.label]) {
                //create all the subgoal children 
                children = [];
                numSubgoals = newState["num-subgoals"];
                for (i = 1; i <= numSubgoals; i++) {
                    id = oldState.label + "." + i;
                    childState = {id: id, name: id};
                    children.push(childState);
                }
                //add generated children to tree
                parent = tree.findDFS(null, nodeSearch(oldState.label));
                if (parent) {
                    parent.children = children;
                } else {console.log("could not find parent"); }
            }
            //so we have seen this state before or at least we have created a node for it so just update the node status
            //probably just done a postpone
            setActiveNode(newState.label, tree);
        } else if (oldState && isParent(newState.label, oldState.label)) {//new state is a parent of oldstate 
            removeChildren(newState.label);
            setActiveNode(newState.label, tree);
        } else if (oldState && oldState.label === newState.label) {
            //if any of the sequents in the new state are marked as changed then
            //create a branch anyway to show that a command has been added to the parent
            state = tree.findDFS(null, function (node) {
                return node.formula ? node.formula === sequentString(newState) && node.name === newState.label
                    : node.name === newState.label;
            });
            if (state) {
                delete state.children;
                delete state.command;
                setActiveNode(state.name, tree);
            } else {
                state = tree.findDFS(null, nodeSearch(newState.label));
                if (state) {
                    childState = {id: state.id + ".0", name: state.name};
                    state.children = [childState];
                    setActiveNode(childState.name, tree);
                } else {
                    throw new Error("state not found!");
                }
            }
        } else {
            //new state is not a descendant so maybe we have just done postpones
            setActiveNode(newState.label, tree);
        }
    }
    /**
     Checks whether or not the state is unchanged.
     The state is unchanged iff any one of the conditions below hold
        1. it is explicitly set in the commentary that it is unchanged
        2. it is a postponed state
        and
        3. its label is the same as the label of the previous state
    */
    function stateUnchanged(state, previousState) {
        return state.label === previousState.label && state.commentary ? state.commentary.some(function (comment) {
            return comment.trim().toLowerCase().indexOf("no change on") === 0 ||
                comment.trim().toLowerCase().indexOf("postponing") === 0;
        }) : false;
    }
    
    /**
    
    */
    function PVSSession() {
        eventDispatcher(this);//enable session object to dispatch events
        allStates = {};
        ps = this;
    }
    /**
         Updates the current state using the data from the pvsresponse. It fires
         either a `statechanged` or a `stateunchanged` event to signal the status of the prooftree
         to any event listeners.
         @param {object} res a jsonrpc result object containing information about the proof state
         @returns {Promise} a promise that resolves with the jsonrpc result object
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
        @param {string} context the path to set as context for the server. This is typically a folder containing pvs source files
        @param {string} file The path (relative to context) to the file to typecheck before beginning the Proof explorer
        @returns {Promise} a promise that resolves when context has been set on server and the file has been typechecked.
    */
    PVSSession.prototype.begin = function (context, file) {
        return comm.changeContext(context)
            .then(function (res) {
                //maybe do something with res and then typecheck
                return comm.typeCheck(file);
            });
    };
    
    /**
        Sends a request to proove a formula in the given theory file. This function fires a 
        "treecreated" event to signal the creation of a prooftree data.
        @param {string} formula the name of the formula to prove
        @param {string} theory the name of the theory from which the formula should be proven
        @returns {Promise} a promise that resolves when the formula is proven
    */
    PVSSession.prototype.proveFormula = function (formula, theory) {
        var ps = this;
        return comm.sendCommand({method: "prove-formula", params: [formula, theory]})
            .then(function (res) {
                currentState = res.jsonrpc_result.result;
                allStates[currentState.label] = new Date().getTime();
                proofTree = new TreeData({id: currentState.label, name: currentState.label});
                setActiveNode(currentState.label, proofTree);
                ps.fire({type: "treecreated", tree: proofTree});
                return Promise.resolve(res);
            });
    };
    /**
        Sends the specified PVS [proof] command to the server. When the result has been received from the server, the current state
        of the tree is updated.
        @param {object} command a command object
        @returns {Promise} a promise that resolves when the result of executing the command on the server returns
    */
    PVSSession.prototype.sendCommand = function (command) {
        var ps = this;
        return comm.sendCommand(command)
            .then(function (res) {
                return ps.updateCurrentState(res);
            });
    };
    /**
        wrapper function for sending the postpone command to the server.
        @returns {Promise} a promise that resolves when the server sends a response.
    */
    PVSSession.prototype.postpone = function () {
        var ps = this;
        return comm.sendCommand({method: "proof-command", params: ["(postpone)"]})
            .then(function (res) {
                return ps.updateCurrentState(res);
            });
    };
    /**
     Utility function for running a repeated postpone until the target node has been reached.
     @param {string} targetName the label of the node to postpone to
     @return {Promise} a promise that resolves when the postpone target has been reached
    */
    PVSSession.prototype.postponeUntil = function (targetName) {
        var ps = this, currentlyActiveName = activeState.name;
        function postpone() {
            return comm.sendCommand({method: "proof-command", params: ["(postpone)"]})
                .then(function (res) {
                    if (res.jsonrpc_result.result.label === targetName ||
                        res.jsonrpc_result.result.label === currentlyActiveName) {
                        return ps.updateCurrentState(res);
                    } else {
                        return postpone();
                    }
                });
        }
        if (targetName === currentlyActiveName) {
            return Promise.resolve(true);
        } else {
            return postpone();
        }
    };
    /**
        Gets the currently active state in the prooftree
    */
    PVSSession.prototype.getActiveState = function () {
        return activeState;
    };
    
    module.exports = PVSSession;
});
