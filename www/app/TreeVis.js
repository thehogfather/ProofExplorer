/**
 * ProofTree visualisation using D3js
 * @author Patrick Oladimeji
 * @date 4/14/14 17:34:16 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent, Promise */

define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3"),
        deepCopy = require("app/deepcopy"),
        eventDispatcher = require("app/util/eventDispatcher"),
        TreeData = require("app/TreeData"),
        proofCommands = require("app/util/ProofCommands"),
        TreeGenerator = require("app/RandomTreeGenerator"),
        StatusLogger = require("app/util/StatusLogger"),
        Tooltip = require("app/util/Tooltip");
    
    var vis = eventDispatcher({}), commandRunner, _session;
    
    function triangle(size) {
        return "M0 0l-" + (size / 2) + " " + size + "h" + size + "Z";
    }
    
    function render(treeData) {
        var targetNode, draggedNode, drag;
        var el = d3.select("#proofTree");
                
        var levelHeight = 70, margin = {top: 50, left: 50, right: 50, bottom: 50};
        
        var w = 900, h = treeData.depth() * levelHeight, rad = 10;
        var diagonal = d3.svg.diagonal();
        
        var zoom = d3.behavior.zoom(), svg, board;
        
        function rescale() {
            svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }
        
        board = el.append("svg")
            .attr("width", w + margin.left + margin.top)
            .attr("height", h + margin.bottom + margin.top)
            .call(zoom).on("dblclick.zoom", null);
        
        //board.append("rect").attr("width", w).attr("height", h).attr("fill", "white");
        
        svg = board.attr("pointer-events", "all")
            .append("g").attr("transform", "translate(" + margin.left + " " + margin.top + ")");
           
        zoom.on("zoom", rescale);
        
        var tree = d3.layout.tree().size([w, h]);
        
        var toggleCollapse, onMouseOver, onMouseOut, onMouseDown, addCommand, onClick;
       
        var nodePointerG = svg.append("g").attr("class", "node-pointer");
        var nodePointer = nodePointerG.append("path").attr("d", triangle(rad * 2));
        
        var pointerDrag = d3.behavior.drag(), startPointerPos, pointerDragging, initialPointerTransform;
        pointerDrag.on("dragstart", function () {
            var pos = d3.mouse(nodePointerG.node());
            initialPointerTransform = nodePointerG.attr("transform");
            startPointerPos = {x: pos[0], y: pos[1]};
            d3.event.sourceEvent.stopPropagation();
            //put pointer behind all nodes
            svg.node().insertBefore(nodePointerG.node(), d3.select("path").node());
            pointerDragging = true;
        }).on("drag", function () {
            var event = d3.event;
            nodePointerG.attr("transform",
                              "translate(" + (event.x + startPointerPos.x) + " " + (event.y - startPointerPos.y) + ")");
            console.log(event);
        }).on("dragend", function () {
            pointerDragging = false;
            if (targetNode) {
                vis.fire({type: "postpone", command: "(postpone)", targetNode: targetNode});
                nodePointerG.attr("transform", "translate(" + targetNode.x + " " + (targetNode.y + (targetNode.command ? rad * 2 : rad)) + ")");
            } else {
                //return to old position
                nodePointerG.attr("transform", initialPointerTransform);
            }
            svg.node().appendChild(nodePointerG.node());
        });
        nodePointerG.call(pointerDrag);
        onClick = function (d) {
            vis.fire({type: "click.node", nodeData: d, nodeEl: d3.select(this)});
        };
        
        onMouseDown = function (d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
            var mouse = d3.mouse(d3.select("body").node());
            if (!d.tooltip) {
                d.tooltip = new Tooltip().render(d, {x: mouse[0], y: mouse[1]});
            } else {
                d.tooltip.remove();
                delete d.tooltip;
            }
        };
        
        onMouseOver = function (d) {
            if ((draggedNode && draggedNode !== d) || pointerDragging) {
                targetNode = d;
                d3.select(this).style("fill", "orange")
                    .style("opacity", 0.5);
            }
            vis.fire({type: "mouseover.node", nodeData: d, nodeEl: d3.select(this)});
        };
        
        onMouseOut = function (d) {
            d3.select(this).style("fill", "none");
            vis.fire({type: "mouseout.node", nodeData: d, nodeEl: d3.select(this)});
            targetNode = null;
        };

        function getSourceLinks(node) {
            return svg.selectAll(".link").filter(function (d) {
                return d.source === node;
            });
        }
        
        function getNodeElements(node) {
            return svg.selectAll(".node").filter(function (d) {
                return d === node;
            });
        }
        
        function visit(node, f) {
            f(node);
            if (node && node.children) {
                node.children.forEach(function (n) {
                    visit(n, f);
                });
            }
        }
        /**
            visit the subtree of the specified node and apply the specified function to the nodes and edges
            @param node the root node of the subtree to traverse
            @param func the function to call on each node and edge element 
        */
        function visitElements(node, func) {
            var nodeEl = getNodeElements(node);
            func(nodeEl);
            var linkEl = getSourceLinks(node);
            func(linkEl);
            if (node && node.children) {
                node.children.forEach(function (n) {
                    visitElements(n, func);
                });
            }
        }
        
        function colorChildren(node) {
            visitElements(node, function (sel) {
                if (sel) {
                    sel.classed("dragging", true);
                }
            });
        }
        
        function uncolorChildren(node) {
            visitElements(node, function (sel) {
                if (sel) {
                    sel.classed("dragging", false);
                }
            });
        }
        
        function commandLabel(command) {
            var args = command.replace(/[()]/g, "").split(" ");
            return args[0];
        }
        
        function decorateCommandNode(el) {
            el.attr("class", "command")
                .style("fill", function (d) {
                    return proofCommands.getColor(d.command);
                })
                .style("stroke", function (d) {
                    return d3.rgb(proofCommands.getColor(d.command)).darker();
                })
                .attr("r", rad * 2).on("mousedown", function () {
                    d3.event.stopPropagation();
                }).call(drag);
            var p = d3.select(el.node().parentNode);
            p.select("g.icon").remove();
            p.append("g").attr("class", "icon")
                .append("svg:foreignObject")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", "40px")
                .attr("height", "40px")
                .append("xhtml:div").attr("xmlns", "http://www.w3.org/1999/xhtml")
                .append("xhtml:img").attr("src", function (d) {
                    return "css/glyphicons/png/glyphicons_" + proofCommands.getIcon(commandLabel(d.command)) + ".png";
                });
            return el;
        }
        
        function updateTree(parent) {
            var duration = 500;
            var maxDepth = treeData.depth();
            h = Math.max(500, levelHeight * maxDepth);
            el.select("svg").attr("width", w + margin.left + margin.right).attr("height", h + margin.top + margin.bottom);
            tree.size([w, h]);
            var nodes = tree.nodes(treeData.getData()),
                links = tree.links(nodes);
            
            var node = svg.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id;
                });
            var enteredNodes = node.enter()
                .insert("g", "g.node-pointer").attr("class", "node")
                .attr("transform", function (d) {
                    var x0 = parent.x0 || d.x, y0 = parent.y0 || d.y;
                    return "translate(" + x0 + " " + y0 + ")";
                });
            
            //append command nodes if there are any
            enteredNodes.each(function (d, i) {
                if (d.command) {
                    var color = proofCommands.getColor(d.command);
                    var nodeCommand = d3.select(this).append("circle");
                    decorateCommandNode(nodeCommand);
                }
                
            });
            //append data nodes
           
            enteredNodes.append("circle")
                .attr("class", "state")
                .attr("r", function (d) {
                    return d._children ? rad * 1.5 : rad;
                });
             
            enteredNodes.append("circle")
                .attr("class", "eventreceiver")
                .attr("r", rad * 3)
                .on("mouseover", onMouseOver)
                .on("mouseout", onMouseOut)
//                .on("dblclick", toggleCollapse)
                .on("mousedown", onMouseDown)
                .on("click", onClick);
            
            //append labels to nodes
            var labelXFunc = function (d) {return d.command ? rad * 2.2 : rad * 1.5; },
                labelString = function (d) {
                    return d.name && d.name.indexOf(".") > -1 ? d.name.substr(d.name.indexOf(".") + 1) : d.name;
                };
            enteredNodes.append("text")
                .attr("x", labelXFunc).attr("y", 0)
                .text(labelString);
            
            var exitedNodes = node.exit().transition().duration(duration)
                .attr("transform", "translate(" + parent.x + " " + parent.y + ")")
                .remove();
            
            var updatedNodes = node.transition().duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + d.x + " " + d.y + ")";
                }).attr("class", function (d) {
                    return d._children ? "node collapsed" : d.active ? "node active" : "node";
                });
            //update label pos
            updatedNodes.select("text").attr("x", labelXFunc);
            //remove command nodes if any and update the node pointer position
            updatedNodes.each(function (d, i) {
                if (!d.command) {
                    d3.select(this).select("circle.command").remove();
                    d3.select(this).select("g.icon").remove();
                }
                if (d.active) {
                    nodePointerG.attr("transform", "translate(" + d.x + " " + (d.y + (d.command ? rad * 2 : rad)) + ")");
                }
            });
            
            var link = svg.selectAll(".link").data(links, function (d) {return d.target.id; });
            var enteredLinks = link.enter()
                .insert("path", "g.node").attr("class", "link")
                .attr("d", function (d) {
                    var x0 = parent.x0 || d.source.x, y0 = parent.y0 || d.source.y;
                    var o = {x: x0, y: y0};
                    return diagonal({source: o, target: o});
                });
            
            enteredLinks.style("stroke", function (d) {
                return proofCommands.getColor(d.source.command);
            }).on("click", function (d) {
                var mouse = d3.mouse(d3.select("body").node());
                if (!d.tooltip) {
                    d.tooltip = new Tooltip().render(d, {x: mouse[0], y: mouse[1]});
                } else {
                    d.tooltip.remove();
                    delete d.tooltip;
                }
            });
            
            link.classed("active", function (d) {
                return d.target && d.target.active;
            }).transition().duration(duration)
                .attr("d", diagonal);
            
            link.exit().transition().duration(duration)
                .attr("d", function (d) {
                    var o = {x: parent.x, y: parent.y};
                    return diagonal({source: o, target: o});
                }).remove();
            
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }
        
        /**
            Add a proof command (strategy to the selected node)
        */
        addCommand = function (node, command, g) {
            //create a promise that resolves when children have been created
            return new Promise(function (resolve, reject) {
                if (!node) {
                    reject({command: command});
                } else {
                    command = command || "(grind)";
                    node.command = command;
                    node.commandLabel = commandLabel;
                    //if g wasnt supplied get it from the dom
                    g = g || getNodeElements(node);
                    g.select(".command").remove();
                    var c = g.insert("circle", "circle");
                    decorateCommandNode(c);
                    resolve(node);
                }
            });
        };
        
        toggleCollapse = function (node) {
            if (node.children) {
                node._children = node.children;
                node.children = null;
                d3.select(this).attr("r", rad * 1.5).classed("collapsed", true);
            } else {
                node.children = node._children;
                node._children = null;
                d3.select(this).attr("r", rad).classed("collapsed", false);
            }
            updateTree(node);
        };
        
        
        /**
            Copies a command from source node to target node and runs the commandRunner function
            which should essentially update the target node with any new children
        */
        function copyCommand(source, target, commandRunner) {
            //sequence is to add command to tree node
            //then to execute that command on the server for that node
            //question is how we make sure the server has the right state
            return addCommand(target, source.command)
                .then(function (target) {
                    return commandRunner(target, target.command);
                })
                .then(function (res) {
                    var node = target, newChildren = target.children;
                    //if the target is already a child of the source we need to filter it out
                    var childCommands = source.children.filter(function (d) {
                        return d.id !== target.id;
                    }), promises;
                    if (childCommands && childCommands.length) {
                        promises = childCommands.map(function (cc, cindex) {
                            return cc.command ? copyCommand(cc, newChildren[cindex], commandRunner)
                                : Promise.reject("no command");
                        });
                        //try to resolve all the promises
                        return Promise.all(promises);
                    } else {
                        return Promise.reject("no child command");
                    }
                });
        }
        
        function registerDrag() {
            drag = d3.behavior.drag().origin(function (d) {return d; });
            var ghostNode, pos;
            drag.on("dragstart", function (d) {
                pos = [d3.event.sourceEvent.x, d3.event.sourceEvent.y];
                draggedNode = d;
                ghostNode = svg.insert("circle", "g")
                    .attr("cx", pos[0])
                    .attr("cy", pos[1])
                    .attr("r", rad * 2).style("display", "none")
                    .attr("class", "ghost");
                d3.select(this).attr("pointer-events", "click");
                colorChildren(d);
                vis.fire({type: "dragstart.node", nodeData: d, nodeEl: d3.select(this), pos: pos});
                //d3.event.sourceEvent.stopPropagation();
            }).on("drag", function (d) {
                //updated position of node
                pos = d3.mouse(svg.node());
                ghostNode.attr("cx", pos[0]).attr("cy", pos[1]).style("display", null);
                vis.fire({type: "drag.node", nodeData: d, nodeEl: d3.select(this), pos: pos});
            }).on("dragend", function (d) {
                var tx = draggedNode.x, ty = draggedNode.y;
                if (targetNode) {
                    //TODO copy command to target node but first check if the current command is the active node and 
                    //make sure it is active before excuting the command on it
                    copyCommand(TreeData.copyTree(d), targetNode, commandRunner || function (node, command) {
                        var numChildren = proofCommands.getMaxChildren(command);
                        node.children = TreeGenerator.generateRandomChildren(numChildren);
                        return Promise.resolve(node);
                    }).then(function (res) {
                        console.log(res);
                    });
                   
                    //update the tree
                    updateTree(targetNode);
                    tx = targetNode.x;
                    ty = targetNode.y;
                }
                draggedNode = null;
                
                ghostNode.transition().duration(200).attr("cx", tx).attr("cy", ty).remove();
                d3.select(this).attr("pointer-events", null);
                uncolorChildren(d);
                
                vis.fire({type: "dragend.node", node: d, nodeEl: d3.select(this), pos: d3.mouse(svg.node())});
            });
            
            d3.selectAll(".node circle.command").call(drag);
        }
        
        function bindKeys() {
            d3.select("body").on("keypress", function () {
                var e = d3.event;
                switch (e.which) {
                case 99://c was pressed so collapse selected node
                    d3.selectAll(".selected").each(function (d) {
                        toggleCollapse(d);
                    });
                        
                    break;
                case 120: //x was pressed so expand selected node
                    d3.selectAll(".selected").each(function (d) {
                        addCommand(d, "(grind)", d3.select(this.parentNode));
                    });
                    break;
                }
            });
        }
        
        registerDrag();
        updateTree(treeData.getData());
        bindKeys();
        
        vis.addCommand = addCommand;

        vis.registerCommandRunner = function (d) {
            commandRunner = d;
        };
        
        vis.initialise = function (session) {
            _session = session;
            session.addListener("statechanged", function (event) {
                var data = event.tree.find(event.state.label) || event.tree.getData();
                updateTree(data);
            }).addListener("stateunchanged", function (event) {
                console.log(event);
                //remove the command to show that it has no effect
                d3.select(".node.active .command").transition().duration(500).attr("r", 0)
                    .each("end", function (d) {
                        delete d.command;
                        d3.select(this).remove();
                    });
                d3.select(".node.active .icon").remove();
            });
        };
    }
    
    vis.render = render;
    module.exports = vis;
});
