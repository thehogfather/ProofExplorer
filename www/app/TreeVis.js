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
        StatusLogger = require("app/util/StatusLogger");
    
    var vis = eventDispatcher({}), treeGeneratorCommand, _session;
    
    
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
        
        board.append("rect").attr("width", w).attr("height", h).attr("fill", "white");
        
        svg = board.attr("pointer-events", "all")
            .append("g").attr("transform", "translate(" + margin.left + " " + margin.top + ")");
           
        zoom.on("zoom", rescale);
        
        var tree = d3.layout.tree().size([w, h]);
        
        var toggleCollapse, onMouseOver, onMouseOut, onMouseDown, addCommand, onClick;
       
        onClick = function (d) {
            vis.fire({type: "click.node", nodeData: d, nodeEl: d3.select(this)});
        };
        
        onMouseDown = function (d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
//            if (!d3.event.shiftKey) {//deselect previous selections if shift wasnt pressed
//                d3.selectAll(".selected").classed("selected", false);
//            }
//            d3.select(this).classed("selected", true);
                
            if (!d.children) {
                _session.postponeUntil(d.id)
                    .then(function (res) {
                        StatusLogger.log(res);
                    });
            }
        };
        
        onMouseOver = function (d) {
            if (draggedNode && draggedNode !== d) {
                targetNode = d;
                d3.select(this).attr("r", rad * 3).style("opacity", 0.5);
            }
            vis.fire({type: "mouseover.node", nodeData: d, nodeEl: d3.select(this)});
        };
        
        onMouseOut = function (d) {
            d3.select(this).attr("r", rad).style("opacity", null)
                .classed("collapsed", false);
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
            return el;
        }
        
        function updateTree(parent) {
            var duration = 500;
            var maxDepth = treeData.depth();
            h = levelHeight * maxDepth;
            el.select("svg").attr("width", w + margin.left + margin.right).attr("height", h + margin.top + margin.bottom);
            tree.size([w, h]);
            var nodes = tree.nodes(treeData.getData()),
                links = tree.links(nodes);
            
            var node = svg.selectAll(".node")
                .data(nodes, function (d) {
                    return d.id;
                });
            var enteredNodes = node.enter()
                .append("g").attr("class", "node")
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
                .attr("r", function (d) {
                    return d._children ? rad * 1.5 : rad;
                })
                .on("dblclick", toggleCollapse)
                .on("mousedown", onMouseDown)
                .on("mouseover", onMouseOver)
                .on("mouseout", onMouseOut)
                .on("click", onClick);
            
            var exitedNodes = node.exit().transition().duration(duration)
                .attr("transform", "translate(" + parent.x + " " + parent.y + ")")
                .remove();
            
            var updatedNodes = node.transition().duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + d.x + " " + d.y + ")";
                }).attr("class", function (d) {
                    return d._children ? "node collapsed" : d.active ? "node active" : "node";
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
        
        function replaceChildren(node, children) {
            var color = proofCommands.getColor(node.command);
            //delete any collapsed nodes
            node._children = null;
            node.children = children;
            getSourceLinks(node).style("stroke", color).classed("command", true);
            updateTree(node);
        }
        
        function appendChildren(node, children) {
            var color = proofCommands.getColor(node.command);
            node.children = node.children || node._children || [];
            node.children = node.children.concat(children);
            var newIds = children.map(function (d) { return d.id; });
            var newLinks = getSourceLinks(node).filter(function (d) {
                return newIds.indexOf(d.target.id) > -1;
            });
            newLinks.style("stroke", color).classed("command", true);
            updateTree(node);
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
            Execute a command on the pvs server and replace the children nodes with the resolved 
            promise.
            
            @param promise a promise to run to obtain data about the node and children to use as replacement in the node
        */
        function executeCommand(promise) {
            return promise.then(function (data) {
                replaceChildren(data.node, data.children);
                return Promise.resolve(data);
            });
        }
        
        /**
            Copies a command from source node to target node and runs the treeGenCommand function
            which should resolve with data of form {node:{}, children:[]}
        */
        function copyCommand(source, target, treeGenCommand) {
            //sequence is to add command to tree node
            //then to execute that command on the server for that node
            //question is how we make sure the server has the right state
            return addCommand(target, source.command)
                .then(function (node) {
                    return executeCommand(treeGenCommand(node));
                })
                .then(function (res) {
                    var node = res.node, newChildren = res.children;
                    //if the target is already a child of the source we need to filter it out
                    var childCommands = source.children.filter(function (d) {
                        return d.id !== target.id;
                    }), promises;
                    if (childCommands && childCommands.length) {
                        promises = childCommands.map(function (cc, cindex) {
                            return cc.command ? copyCommand(cc, newChildren[cindex], treeGenCommand)
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
                ghostNode = svg.insert("circle", "path")
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
                    //create children property if there is currently none
                    if (!targetNode.children) {
                        targetNode.children = targetNode._children || [];
                    }
                    //TODO copy command to target node but first check if the current command is the active node and 
                    //make sure it is active before excuting the command on it
                    copyCommand(TreeData.copyTree(d), targetNode, treeGeneratorCommand || function (node) {
                        var numChildren = proofCommands.getMaxChildren(node.command);
                        return Promise.resolve({node: node, children: TreeGenerator.generateRandomChildren(numChildren)});
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
                console.log(e.which);
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
        vis.replaceChildren = replaceChildren;
        vis.appendChildren = appendChildren;
        vis.executeCommand = executeCommand;
        
        vis.registerTreeGeneratorCommand = function (d) {
            treeGeneratorCommand = d;
        };
        
        vis.initialise = function (session) {
            _session = session;
            session.addListener("statechanged", function (event) {
                var data = event.tree.getData();
                updateTree(data);
            }).addListener("stateunchanged", function (event) {
                console.log(event);
                //remove the command to show that it has no effect
                d3.select(".node.active .command").transition().duration(500).attr("r", 0)
                    .each("end", function () {
                        d3.select(this).remove();
                    });
            });
        };
    }
    
    vis.render = render;
    module.exports = vis;
});
