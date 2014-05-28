/**
 * ProofTree visualisation using D3js
 * @author Patrick Oladimeji
 * @date 4/14/14 17:34:16 PM
 */
/*jshint undef: true, unused: true */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define,Promise */

define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3"),
        eventDispatcher = require("app/util/eventDispatcher"),
        TreeData = require("app/TreeData"),
        proofCommands = require("app/util/ProofCommands"),
        Tooltip = require("app/util/Tooltip");
    
    var iconsUrlBase = "css/glyphicons/png/glyphicons_",
        iconWidth = "20px",
        iconHeight = "20px";
    
    var el, svg, rad = 10, targetNode, draggedNode, drag;
    var w, h, levelHeight = 70, margin = {top: 50, left: 50, right: 50, bottom: 50};
    var diagonal = d3.svg.diagonal(), zoom = d3.behavior.zoom(), board;
    var pointerDrag = d3.behavior.drag(), startPointerPos, pointerDragging, initialPointerTransform;
    var vis, commandRunner, treeData, tree, nodePointerG;
    
    function iconUrl(iconName) {
        return iconsUrlBase.concat("{0}.png").format(iconName);
    }
    
    function triangle(size) {
        return "M0 0l-" + (size / 2) + " " + size + "h" + size + "Z";
    }
    
    function getNodeElements(node) {
        return svg.selectAll(".node").filter(function (d) {
            return d === node;
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
            });
        var p = d3.select(el.node().parentNode);        
        p.select("g.icon").remove();
        p.append("g").attr("class", "icon")
            .append("svg:foreignObject")
            .attr("x", rad)
            .attr("y", rad)
            .attr("width", iconWidth)
            .attr("height", iconHeight)
            .append("xhtml:img").attr("src", function (d) {
                return iconUrl(proofCommands.getIcon(commandLabel(d.command)));
            });
        return el;
    }
    
    function rescale() {
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        vis.fire({type: "transform", scale: d3.event.scale, translate: d3.event.translate});
    }
    
    var onClick = function (d) {
        var mouse = d3.mouse(d3.select("body").node());
        if (d.formula) {
            if (!d.tooltip) {
                d.tooltip = new Tooltip().render(d, {x: mouse[0], y: mouse[1]});
            } else {
                d.tooltip.remove();
                delete d.tooltip;
            }
        }
        vis.fire({type: "click.node", nodeData: d, nodeEl: d3.select(this)});
    };
        //register mousedown handler for nodes
    var onMouseDown = function () {
        d3.event.preventDefault();
        d3.event.stopPropagation();
    };

    var onMouseOver = function (d) {
        if ((draggedNode && draggedNode !== d) || pointerDragging) {
            targetNode = d;
            d3.select(this).style("fill", "orange")
                .style("opacity", 0.5);
        }
        //show the minimise icon
        d3.select(this.parentNode).select(".collapser img").style("display", null);
        vis.fire({type: "mouseover.node", nodeData: d, nodeEl: d3.select(this)});
    };

    var onMouseOut = function (d) {
        d3.select(this).style("fill", "none");
        d3.select(this.parentNode).select(".collapser img").style("display", "none");
        vis.fire({type: "mouseout.node", nodeData: d, nodeEl: d3.select(this)});
        targetNode = null;
    };
        
    /**
        Add a proof command (strategy to the selected node)
    */
    var addCommand = function (node, command, g) {
        //create a promise that resolves when children have been created
        return new Promise(function (resolve, reject) {
            if (!node) {
                reject({command: command});
            } else {
                var p = node.parent;
                //need to make sure that collapsed node are expanded before applying commands            
                while (p && p._children) {
                    p.children = p._children;
                    p = p.parent;
                }
                
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
    
    function createActiveNodePointer() {
        var nodePointerG = svg.append("g").attr("class", "node-pointer");
        nodePointerG.append("path").attr("d", triangle(rad * 1.5));
        
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
        return nodePointerG;   
    }
        
    var toggleCollapse = function (node) {
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
        Update the proof tree. Add new nodes, remove deleted or hidden nodes
        @param parent The parent node for any added or deleted nodes
    */
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
        enteredNodes.each(function (d) {
            if (d.command) {
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
        //add node to recieve events - this is a transparent node that allows good feedback when an object is dragged over a node
        enteredNodes.append("circle")
            .attr("class", "event-receiver")
            .attr("r", rad * 3)
            .on("mouseover", onMouseOver)
            .on("mouseout", onMouseOut)
            .on("mousedown", onMouseDown)
            .on("click", onClick)
            .call(drag);
        //add collapse expand toggle to the top right
        enteredNodes.append("g").attr("class", "collapser")
            .on("mouseover", function () { d3.select(this).select("img").style("display", null);})
            .on("mouseout", function () { d3.select(this).select("img").style("display", "none");})
            .append("foreignObject").attr("x", -rad * 2).attr("y", -rad * 3).attr("width", iconWidth).attr("height", iconHeight)
            .append("xhtml:img").on("click", toggleCollapse);

        //append labels to nodes
        var labelXFunc = function (d) {return d.command ? rad * 2.2 : rad * 1.5; },
            labelString = function (d) {
                return d.name && d.name.indexOf(".") > -1 ? d.name.substr(d.name.indexOf(".") + 1) : d.name;
            };
        enteredNodes.append("text")
            .attr("x", labelXFunc).attr("y", 0)
            .text(labelString);

        var exitedNodes = node.exit();
        exitedNodes.transition().duration(duration)
            .attr("transform", "translate(" + parent.x + " " + parent.y + ")")
            .remove();

        var updatedNodes = node;
        updatedNodes.transition().duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.x + " " + d.y + ")";
            });
        updatedNodes.classed("node", true)
            .classed("active", function (d) { return d.active; })
            .classed("collapsed", function (d) {return d._children; });

        //update label pos
        updatedNodes.select("text").attr("x", labelXFunc);
        //update the collapse expand icons
        updatedNodes.selectAll(".collapser img")
            .attr("src", function (d) {
                var iconName = (d._children ? "circle_plus" : d.children ? "circle_minus" : "");
                return iconName.length ? iconUrl(iconName) : iconName;
            });
        //remove command nodes if any and update the node pointer position
        updatedNodes.each(function (d) {
            if (!d.command) {
                d3.select(this).select("circle.command").remove();
                d3.select(this).select("g.icon").remove();
            }
            //check if node has hidden child that is currently active
            var hiddenActive = false;
            TreeData.visit(function (node) {
                if (node !== d) {
                    hiddenActive = node.active;
                    return node.active;
                }
                return false;
            }, d, null, null, function (d) {return d._children || d.children; });
            if (d.active || hiddenActive) {
                nodePointerG.attr("transform", "translate(" + d.x + " " + (d.y + (d.command ? rad * 2 : rad)) + ")");
            }
            d3.select(this).classed("hidden-active", hiddenActive);
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
        }).on("mouseover", function () {
            d3.select(this).classed("bolder", true);
        }).on("mouseout", function () {
            d3.select(this).classed("bolder", false);
        });

        link.classed("active", function (d) {
            return d.target && d.target.formula; //d.target && d.target.active;
        }).transition().duration(duration)
            .attr("d", diagonal);

        link.exit().transition().duration(duration)
            .attr("d", function () {
                var o = {x: parent.x, y: parent.y};
                return diagonal({source: o, target: o});
            }).remove();

        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
        
    /**
        Copies a command from source node to target node and runs the commandRunner function
        which should essentially update the target node with any new children
    */
    var copyCommand = function (source, target, commandRunner) {
        //sequence is to add command to tree node
        //then to execute that command on the server for that node
        //question is how we make sure the server has the right state
        return addCommand(target, source.command)
            .then(function (target) {
                return commandRunner(target, target.command);
            })
            .then(function () {
                var newChildren = target.children;
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
    };
    
    function TreeVis(_treeData) {
        vis = eventDispatcher(this);
        treeData = _treeData;
        el = d3.select("#proofTree");
        w = 900;
        h = treeData.depth() * levelHeight;
        tree = d3.layout.tree().size([w, h]);
        board = el.append("svg")
            .attr("width", w + margin.left + margin.top)
            .attr("height", h + margin.bottom + margin.top)
            .call(zoom).on("dblclick.zoom", null);
        
        //board.append("rect").attr("width", w).attr("height", h).attr("fill", "white");
        
        svg = board.attr("pointer-events", "all")
            .append("g").attr("transform", "translate(" + margin.left + " " + margin.top + ")");
           
        zoom.on("zoom", rescale);
        nodePointerG = createActiveNodePointer();       
        /**
            This initialises and registers the drag events on the nodes. The drag
            object is later used for entered nodes in the updateTree function.
            This allows node commands to be copied between branches in the tree.
        */
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
                vis.fire({type: "dragstart.node", nodeData: d, nodeEl: d3.select(this), pos: pos});
            }).on("drag", function (d) {
                //updated position of node
                pos = d3.mouse(svg.node());
                ghostNode.attr("cx", pos[0]).attr("cy", pos[1]).style("display", null);
                vis.fire({type: "drag.node", nodeData: d, nodeEl: d3.select(this), pos: pos});
            }).on("dragend", function (d) {
                var tx = draggedNode.x, ty = draggedNode.y;
                if (targetNode) {
                    copyCommand(TreeData.copyTree(d), targetNode, commandRunner)
                    .then(function (res) {
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
                
                vis.fire({type: "dragend.node", node: d, nodeEl: d3.select(this), pos: d3.mouse(svg.node())});
            });
            
            d3.selectAll(".node circle.command").call(drag);
        }
        
        registerDrag();
        updateTree(treeData.getData());        
    }
    
    TreeVis.prototype.addCommand = addCommand;
    
    TreeVis.prototype.registerCommandRunner = function (d) {
        commandRunner = d;
    };
    
    TreeVis.prototype.initialise = function (session) {
        session.addListener("statechanged", function (event) {
            var data = event.tree.find(null, function (node) { return node.id === event.state.label; }) || event.tree.getData();
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
    module.exports = TreeVis;
});