/**
 * A collection of proof commands for use withing the pvs system
 * @author Patrick Oladimeji
 * @date 4/22/14 15:32:14 PM
 */
/*jshint unused: true, undef: true*/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window, Handlebars */
define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3"),
        TreeVis = require("app/TreeVis"),
        proofCommands = require("app/util/ProofCommands"),
        PVSSession = require("app/PVSSession"),
        StatusLogger = require("app/util/StatusLogger"),
        SetupView = require("app/util/SetupView"),
        MenuBar  = require("app/MenuBar"),
        AllCommandsView = require("app/AllCommandsView"),
        favoriteCommands = require("app/FavoriteCommands").getInstance(),
        ToolPalette  = require("app/ToolPalette"),
        fileListTemplate = require("text!app/templates/filelist.hbs");
    
    var commands = proofCommands.getCommands(),
        draggedCommand,
        targetNodeEvent,
        session = new PVSSession(),
        treeVis, viewportControls;
    var setup = new SetupView();

    function commandClicked(label, command) {
        var txt = d3.select("#txtCommand");
        txt.property("value", command);
        txt.node().focus();
    }
    
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
        console.log(event);
    }
    
    function proofCommand(command) {
        return {method: "proof-command", params: [command]};
    }
    
    function populateTheoryFileList(files) {
        var t = Handlebars.compile(fileListTemplate);
        var html = t(files);
        $("#theory-files ul").html(html);
        //add listener for setting the selected theory file
        $("#theory-files li").on("click", function () {
            $("#theory-files button span.filename").html($(this).html());
        });
    }
    
    function reloadToolbox(event) {
        ToolPalette.create(event.commands)
            .on("commandclicked", commandClicked);
    }
    
    function bindToolBoxEvents() {
        favoriteCommands.addListener("commandadded", reloadToolbox)
        .addListener("commandremoved", reloadToolbox);
        d3.select("#txt-context").on("blur", function () {
            var context = d3.select(this).property("value");
            var spinner = d3.select(this.parentNode).append("i").attr("class", "fa fa-spinner fa-spin");
            session.changeContext(context)
                .then(function (res) {
                    console.log(res);
                    spinner.remove();
                    populateTheoryFileList(res.files);
                }, function (err) {
                    console.log(err);
                    spinner.attr("class", "fa fa-warning");
                });
        });
        
        d3.select("#prove-formula").on("click", function () {
            var formula = d3.select("#txt-formula").property("value");
            var theory = d3.select("#theory-files button span.filename").text().split(".")[0];
            if (formula && theory) {
                session.typeCheck(theory)
                    .then(function (res) {
                        StatusLogger.log(res);
                        return session.proveFormula(formula, theory);
                    }).then(function (res) {
                        StatusLogger.log(res);
                        setup.hide();
                        d3.select("#toolbox").style("display", "block");
                    });
            }
        });
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
            }).addListener("transform", function (event) {
                //show scale and translate data
                viewportControls.select(".scale").html("Zoom: " + Math.round(event.scale * 100) + "%");
            });
        
        //add event for free text
        
        d3.select("#console-tab").on("click", function () {
            var cbody = d3.select("#console-list");
            if (cbody.style("display")) {
                cbody.style("display", null);
            } else {
                cbody.style("display", "none");
            }
        });
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
        function windowResized() {
            var menubarHeight = $("#menubar").height(),
                topToolBoxHeight = $("#toolbox").height(),
                bodyHeight = $(window).height(),
                bottomNavHeight = $("#bottom-nav").height();
            var usableHeight = (bodyHeight - menubarHeight - bottomNavHeight - topToolBoxHeight);
            $("#proofTree").height( usableHeight / 2);
            $("#status").css("max-height", usableHeight / 2);
        }
        window.onresize = windowResized;
        windowResized();
    }
    
    function createUI() {
        setup.render();
        var pad = 20,
            iconRad = 15,
            viewportControlHeight = 40,
            viewportControlWidth = 90;
        
        function createControls() {
            //map the string data to create objects whose command attributes is the string
            var data = commands.map(function (d) {
                return {x: 0, y: 0, command: d};
            });

            var tb = d3.select("svg").insert("g", "g").attr("transform", "translate(0  " + viewportControlHeight + ")");
            viewportControls = d3.select("svg").insert("g", "g").classed("viewport-control", true);
            viewportControls.append("foreignObject").attr("x", 0).attr("y", 0).attr("width", viewportControlWidth).attr("height", viewportControlHeight)
                .append("xhtml:span").classed("scale", true);
            
            var icong = tb.selectAll(".button").data(data).enter()
                .append("g").attr("class", "button")
                .attr("transform", function (d, i) {
                    return "translate(" + pad + " " + (i * (iconRad * 2 + pad)) + ")";
                });

            var button = icong.append("circle");
            button.attr("r", iconRad)
                .attr("cx", iconRad)
                .attr("cy", iconRad)
                .style("fill", function (d) {
                    return proofCommands.getColor(d.command);
                }).style("stroke", function (d) {
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
            
            var gBR = tb.node().getBoundingClientRect();
            tb.insert("rect", "g.button").attr("y", -pad).attr("x", -pad)
                .attr("rx", iconRad).attr("ry", iconRad)
                .classed("recent-commands", true)
                .attr("width", gBR.width + (2 * pad)).attr("height", gBR.height + (2 * pad));
            
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
            }).on("drag", function () {
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
                                        console.debug(node);
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
        
        session.addListener("treecreated", function (event) {
            treeVis = new TreeVis(event.tree);
            
            treeVis.initialise(session);
            
            createControls();
            MenuBar.create()
                .on("menuclicked", function (label) {
                    label = label.trim().toLowerCase();
                    if (label ===  "open") {
                        setup.show();
                    } else if (label === "quit") {
                        
                    } else if (label === "set toolbar commands") {
                        AllCommandsView.create();
                    }
                });
            
            treeVis.registerCommandRunner(function (node, command) {
                return session.postponeUntil(node.id)
                    .then(function () {
                        return session.sendCommand(proofCommand(command));
                    });
            });
            bindEvents();
        });
        
        bindToolBoxEvents();
    }
    
    module.exports = {
        createUI: createUI
    };
});
