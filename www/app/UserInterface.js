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
        CommandsMenu = require("app/CommandsMenu"),
        ToolPalette  = require("app/ToolPalette"),
        Tooltip      = require("app/util/Tooltip"),
        nodeRad = 10;

    var commands = proofCommands.getCommands(),
        draggedCommand,
        targetNodeEvent,
        session = new PVSSession();
    
    function onTreeNodeMouseOver(event) {
        if (draggedCommand) {
            var nodeEl = event.nodeEl;
            nodeEl.style("fill", "orange")
                    .style("opacity", 0.5);
            targetNodeEvent = event;
        }
    }
    
    function onTreeNodeMouseOut(event) {
        if (draggedCommand) {
            var nodeEl = event.nodeEl;
            nodeEl.style("fill", "none");
        }
        targetNodeEvent = null;
    }
    
    function onTreeNodeClicked(event) {
        
    }
    
    function proofCommand(command) {
        return {method: "proof-command", params: [command]};
    }
    
    function bindEvents() {
        
        function processCommand(command) {
            if (command && command.trim().length) {
                if (proofCommands.getCommands().indexOf(command) < 0) {
                    proofCommands.getCommands().push(command);
                }
                if (command !== "(postpone)" || command !== "(undo)") {
                    treeVis.addCommand(session.getActiveState(), command);
                }
                session.sendCommand(proofCommand(command))
                    .then(function (res) {
                        console.log(res);
                        StatusLogger.log(res);
                    });
            }
        }
        
        function _sendCommand(command) {
            processCommand(command);
            //clear the textbox
            d3.select("#txtCommand").property("value", "");
        }
        
        treeVis.addListener("mouseover.node", onTreeNodeMouseOver)
            .addListener("mouseout.node", onTreeNodeMouseOut)
            .addListener("click.node", onTreeNodeClicked)
            .addListener("postpone", function (event) {
                session.postponeUntil(event.targetNode.id)
                    .then(function (res) {
                        StatusLogger.log(res);
                    });
            });
        
        //add event for free text
        d3.select("#send").on("click", function () {
            var command = d3.select("#txtCommand").property("value");
            _sendCommand(command);
        });
        d3.select("#txtCommand").on("keydown", function () {
            if (d3.event.which === 13) {
                _sendCommand(d3.select("#txtCommand").property("value"));
            }
        });
        
        //add listener for window resize so that the height of the components on the interface are properly redistributed
        function windowResized(event) {
            console.log(event);
            var navControlHeight = $("#navControl").height(),
                consoleHeight = $("#console").height(),
                bodyHeight = window.outerHeight,
                bodyWidth = window.outerWidth,
                browserHeader = window.screen.height - window.screen.availHeight;
            $("#proofTree").height(bodyHeight - navControlHeight);
            $("#info-div").height(bodyHeight - navControlHeight);
            $(".container").width(bodyWidth - $("#toolPalette")[0].getBoundingClientRect().width);
        }
        window.onresize = windowResized;
        windowResized();
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

            var tb = d3.select("svg").insert("g", "g");
            var icong = tb.selectAll(".button").data(data).enter()
                .append("g").attr("class", "button")
                .attr("transform", function (d, i) {
                    return "translate(20 " + (i * (iconRad * 2 + pad)) + ")";
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
                ghostNode = tb.insert("circle", "g").attr("r", iconRad)
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
            }).on("dragend", function (d) {
                if (targetNodeEvent) {
                    var tData = targetNodeEvent.nodeData,
                        tEl = targetNodeEvent.nodeEl;
                    session.postponeUntil(targetNodeEvent.nodeData.id)
                        .then(function () {
                            if (d.command !== "(postpone)") {
                                treeVis.addCommand(tData, d.command, d3.select(tEl.node().parentNode))
                                    .then(function (node) {
                                        var pvsCommand = proofCommand(d.command);
                                        //The sendCommand is an asynchronous call to process a command on a branch of a proof tree
                                        session.sendCommand(pvsCommand)
                                            .then(function (res) {
                                                StatusLogger.log(res);
                                            });
                                    });
                            }
                        });
                }
                ghostNode.remove();
                draggedCommand = null;
                
            });
            tb.selectAll("circle").call(drag);
        }
        
        function commandClicked(label, command) {
            var txt = d3.select("#txtCommand");
            txt.property("value", command);
            txt.node().focus();
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
            ToolPalette.create()
                .on("commandclicked", commandClicked);
            treeVis.initialise(session);
            
            createControls();
            CommandsMenu.create(session)
                .on("commandclicked", commandClicked);
            
            treeVis.registerCommandRunner(function (node, command) {
                return session.postponeUntil(node.id)
                    .then(function (res) {
                        return session.sendCommand(proofCommand(command));
                    });
            });
        });
        
        bindEvents();
    }
    
    module.exports = {
        createUI: createUI
    };
});
