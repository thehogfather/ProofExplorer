/**
 * A collection of proof commands for use withing the pvs system
 * @author Patrick Oladimeji
 * @date 4/22/14 15:32:14 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent, Promise */
define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3"),
        treeVis = require("app/TreeVis"),
        TreeGenerator = require("app/RandomTreeGenerator"),
        proofCommands = require("app/util/ProofCommands"),
        PVSSession = require("app/PVSSession"),
        StatusLogger = require("app/util/StatusLogger"),
        nodeRad = 10;

    var commands = proofCommands.getCommands(),
        draggedCommand,
        targetNodeEvent,
        session = new PVSSession();
    
    function onTreeNodeMouseOver(event) {
        if (draggedCommand) {
            var nodeEl = event.nodeEl;
            nodeEl.attr("r", nodeRad * 3).style("opacity", 0.5);
            targetNodeEvent = event;
        }
    }
    
    function onTreeNodeMouseOut(event) {
        if (draggedCommand) {
            var nodeEl = event.nodeEl;
            nodeEl.attr("r", nodeRad).style("opacity", null);
        }
        targetNodeEvent = null;
    }
    
    function onTreeNodeClicked(event) {
        
    }
    
    function proofCommand(command) {
        return {method: "proof-command", params: [command]};
    }
    
    function bindEvents() {
        treeVis.addListener("mouseover.node", onTreeNodeMouseOver)
            .addListener("mouseout.node", onTreeNodeMouseOut)
            .addListener("click.node", onTreeNodeClicked);
        
        //add event for free text
        d3.select("#send").on("click", function () {
            var command = d3.select("#txtCommand").property("value");
            session.sendCommand(proofCommand(command))
                .then(function (res) {
                    console.log(res);
                    StatusLogger.log(res);
                });
        });
    }
    
  
    
    function createUI() {
        var pad = 20, iconRad = 15, w = (iconRad * 2  + pad) * commands.length, h = iconRad * 2, colors = d3.scale.category10();
        
        var context = "/home/chimed/pvs-github/ProofExplorer/examples",
            file = "predictability_th";
        
        function createControls() {
            //map the string data to create objects whose command attributes is the string
            var data = commands.map(function (d) {
                return {x: 0, y: 0, command: d};
            });

            //var tb = d3.select("svg g");
            var tb = d3.select("svg").insert("g", "g");
            var icong = tb.selectAll(".button").data(data).enter()
                .append("g").attr("class", "button")
                .attr("transform", function (d, i) {
                    return "translate(" + (i * (iconRad * 2 + pad)) + ", 0)";
                });

            var button = icong.append("circle")
                .attr("r", iconRad)
                .attr("cx", iconRad)
                .attr("cy", iconRad)
                .style("fill", function (d, i) {
                    return proofCommands.getColor(d.command);
                }).style("stroke", function (d, i) {
                    return d3.rgb(proofCommands.getColor(d.command)).darker();
                }).on("click", function (d) {
                    if (["(postpone)", "(undo)"].indexOf(d.command) > -1) {
                        session.sendCommand(proofCommand(d.command))
                            .then(function (res) {
                                StatusLogger.log(res);
                            });
                    }
                });
            icong.append("text").attr("y", iconRad * 2)
                .attr("x", iconRad)
                .attr("text-anchor", "middle")
                .text(function (d) { return d.command; });
            //register drag listener
            var drag = d3.behavior.drag().origin(function (d) {
                return d;
            });
            var ghostNode;
            drag.on("dragstart", function (d) {
                ghostNode = tb.insert("circle", "g").attr("r", iconRad / 2)
                    .attr("cx", d3.event.sourceEvent.x)
                    .attr("cy", d3.event.sourceEvent.y)
                    .attr("class", "ghost")
                    .style("fill", proofCommands.getColor(d.command))
                    .style("stroke", d3.rgb(proofCommands.getColor(d.command)).darker())
                    .style("display", "none");
                draggedCommand = d;
                d3.event.sourceEvent.stopPropagation();
            }).on("drag", function (d) {
                var pos = d3.mouse(tb.node());
                ghostNode.attr("cx", pos[0]).attr("cy", pos[1]).style("display", null);
                ghostNode.style("display", null);
            }).on("dragend", function (d) {
                if (targetNodeEvent) {
                    var tData = targetNodeEvent.nodeData,
                        tEl = targetNodeEvent.nodeEl;
                    session.postponeUntil(targetNodeEvent.nodeData.id)
                        .then(function () {
                            treeVis.addCommand(tData, d.command, d3.select(tEl.node().parentNode))
                                .then(function (node) {
                                   
                                    var numChildren = proofCommands.getMaxChildren(d.command);
                                    var pvsCommand = proofCommand(d.command);
                                    //The sendCommand is an asynchronous call to process a command on a branch of a proof tree
                                    //it should resolve to an object containing {node: object, children: array}
                                    session.sendCommand(pvsCommand)
                                        .then(function (res) {
                                            StatusLogger.log(res);
                                            
            //                                var getTreeCommand = Promise.resolve({node: node, children: TreeGenerator.generateRandomChildren(numChildren)});
            //                                //we send this command to the visual tree so that it can use the result to create the appropriate visual
            //                                //representation once the Promise has been resolved
            //                                treeVis.executeCommand(getTreeCommand);
                                        });
                                });
                        });
                }
                ghostNode.remove();
                draggedCommand = null;
                
            });

            tb.selectAll("circle").call(drag);
        }
        
         //begin the session
        session.begin(context, file)
            .then(function (res) {
                StatusLogger.log(res);
                return session.proveFormula("dn_button_predictable", "predictability_th");
            }).then(function (res) {
                StatusLogger.log(res);
            });
        
        session.addListener("treecreated", function (event) {
            treeVis.render(event.tree);
            treeVis.initialise(session);
            createControls();
        });
        
        bindEvents();
    }
    
    module.exports = {
        createUI: createUI
    };
});
