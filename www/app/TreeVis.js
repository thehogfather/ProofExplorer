/**
 * 
 * @author Patrick Oladimeji
 * @date 4/14/14 17:34:16 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */

define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3"),
        deepCopy = require("app/deepcopy");
    
    function depth(tree) {
        if (!tree || !tree.children || !tree.children.length) {
            return 1;
        }
        return 1 + d3.max(tree.children.map(function (d) {
            return depth(d) + 1;
        }));
    }
    
    function render(data) {
        var targetNode, draggedNode, drag;
        var el = d3.select("body");
        var levelHeight = 70, margin = {top: 50, left: 50, right: 50, bottom: 50}, i = 0;
        var w = 900, h = depth(data) * levelHeight, rad = 5;
        var diagonal = d3.svg.diagonal();
        
        var zoom = d3.behavior.zoom(), svg, board;
        
        function rescale() {
            svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }
        
        board = el.append("svg").attr("width", w + margin.left + margin.top).attr("height", h + margin.bottom + margin.top).call(zoom);
        board.append("rect").attr("width", w).attr("height", h).attr("fill", "white");
        
        svg = board.attr("pointer-events", "all")
            .append("g").attr("transform", "translate(" + margin.left + " " + margin.top + ")");
           
        zoom.on("zoom", rescale);
        
        var tree = d3.layout.tree().size([w, h]);
        var nodes = tree.nodes(data),
            links = tree.links(nodes);
        
        var toggleCollapse, onMouseOver, onMouseOut, onMouseDown;
       
        onMouseDown = function (d) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
        };
        
        onMouseOver = function (d) {
            if (draggedNode && draggedNode !== d) {
                targetNode = d;
                d3.select(this).attr("r", rad * 3).style("opacity", 0.5);
            }
        };
        
        onMouseOut = function (d) {
            if (targetNode) {
                d3.select(this).attr("r", rad).style("opacity", null)
                    .classed("collapsed", false);
            }
            targetNode = null;
        };
        /** 
            get the links whose target are the given node
        
        */
        function getTargetLinks(node) {
            if (!node.parent) {
                return;
            }
            return tree.links([node.parent]).filter(function (d) {
                return d.target === node;
            });
        }
        
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
        
        function copyTree(node) {
            var nodeCopy = deepCopy(node, "parent");
            nodeCopy.parent = node.parent;
            visit(nodeCopy, function (n) {
                if (n) {
                    n.id = ++i;
                    if (n.children) {
                        n.children.forEach(function (c) {
                            c.parent = n;
                        });
                    }
                }
            });
            return nodeCopy;
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
        
        function updateTree(parent) {
            var duration = 500;
            var maxDepth = depth(data);
            h = levelHeight * maxDepth;
            d3.select("svg").attr("width", w + margin.left + margin.right).attr("height", h + margin.top + margin.bottom);
            tree.size([w, h]);
            var nodes = tree.nodes(data),
                links = tree.links(nodes);
            
            var node = svg.selectAll(".node")
                .data(nodes, function (d) {
                    d.id = d.id || ++i;
                    return d.id;
                });
            var enteredNodes = node.enter()
                .append("g").attr("class", "node")
                .attr("transform", "translate(" + parent.x0 + " " + parent.y0 + ")");
            
            enteredNodes.append("circle")
                .attr("r", function (d) {
                    return d._children ? rad * 1.5 : rad;
                }).classed("collapsed", function (d) {
                    return d._children ? true : false;
                })
                .on("click", toggleCollapse)
                .on("mousedown", onMouseDown)
                .on("mouseover", onMouseOver)
                .on("mouseout", onMouseOut).call(drag);
            
            var exitedNodes = node.exit().transition().duration(duration)
                .attr("transform", "translate(" + parent.x + " " + parent.y + ")")
                .remove();
            
            var updatedNodes = node.transition().duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + d.x + " " + d.y + ")";
                });
            
            var link = svg.selectAll(".link").data(links, function (d) {return d.target.id; });
            var enteredLinks = link.enter()
                .insert("path", "g.node").attr("class", "link")
                .attr("d", function (d) {
                    var o = {x: parent.x0, y: parent.y0};
                    return diagonal({source: o, target: o});
                });
            
            link.transition().duration(duration)
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
        
        function registerDrag() {
            drag = d3.behavior.drag().origin(function (d) {return d; });
            var ghostNode, pos;
            drag.on("dragstart", function (d) {
                pos = [d3.event.sourceEvent.x, d3.event.sourceEvent.y];
                draggedNode = d;
                ghostNode = svg.insert("circle", "path")
                    .attr("cx", pos[0])
                    .attr("cy", pos[1])
                    .attr("r", rad).style("display", "none");
                d3.select(this).attr("pointer-events", "click");
                colorChildren(d);
                //d3.event.sourceEvent.stopPropagation();
            }).on("drag", function (d) {
                //updated position of node
                pos = [d3.event.x, d3.event.y];
                ghostNode.attr("cx", pos[0]).attr("cy", pos[1]).style("display", null);
              
            }).on("dragend", function (d) {
                console.log(d);
                if (targetNode) {
                    //create children property if there is currently none
                    if (!targetNode.children) {
                        targetNode.children = targetNode._children || [];
                    }
                    //copy nodes if shiftkey is selected or move the nodes otherwise
                    if (d3.event.sourceEvent.shiftKey) {
                        var index = d.parent.children.indexOf(d);
                        if (index > -1) {
                            d.parent.children.splice(index, 1);
                        }
                        targetNode.children.push(d);
                        console.log("moved nodes");
                    } else {
                        var copy = copyTree(d);
                        targetNode.children.push(copy);
                        console.log("copied nodes");
                    }
                    //update the tree
                    updateTree(targetNode);
                }
                d3.select(this).select("circle").attr("r", rad);
                draggedNode = null;
                
                ghostNode.remove();
                d3.select(this).attr("pointer-events", null);
                uncolorChildren(d);
            });
            
            d3.selectAll(".node circle").call(drag);
        }
        
        var link = svg.selectAll(".link")
            .data(links).enter()
            .append("path")
            .attr("class", "link")
            .attr("d", diagonal);
        
        var node = svg.selectAll(".node")
            .data(nodes).enter()
            .append("g").attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + " " + d.y + ")";
            });
        
        node.append("circle").attr("r", rad)
            .on("mouseover", onMouseOver)
            .on("mouseout", onMouseOut)
            .on("mousedown", onMouseDown)
            .on("click", toggleCollapse);
        
        registerDrag();
    }
    
    module.exports = {
        render: render
    };
});
