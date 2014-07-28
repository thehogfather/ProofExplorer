/**
 * Readonly treelist visualisation
 * @author Patrick Oladimeji
 * @date 6/2/14 23:30:53 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";
    var data,
        el,
        listHeight = 28,
        childIndent = 10,
        duration = 200,
//        contextMenuItems = ["New File", "New Folder", "Rename", "Delete"],
        selectedData;
    var globalId = 0;
    var eventDispatcher = require("app/util/eventDispatcher"),
        d3 = require("d3"),
        property = require("app/util/property");
    
    require("d3.layout.treelist");
    
    function TreeList(d, _el) {
        eventDispatcher(this);
        data = d;
        el = _el || "body";
        d3.select(el).html("");
        this.labelFunction = property.call(this, function (d) { return d.name; });
        this.render(data);
    }
    
    TreeList.prototype.render =   function (parent, noAnimation) {
        var fst = this;
        function toggleChildren(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
        }
        
        var tree = d3.layout.treelist().childIndent(childIndent).nodeHeight(listHeight);
        
        var nodes = tree.nodes(data);
        var ul = d3.select(el).select("ul");
        if (ul.empty()) {
            ul = d3.select(el).append("ul");
        }
        ul.attr("class", "treelist").style("position", "relative")
            .style("list-style", "none");

        var nodeEls = ul.selectAll("li.node").data(nodes, function (d) {
            d.id = d.id || ++globalId;
            return d.id;
        });

        var enteredNodes = nodeEls.enter()
            .append("li")
            .style("position", "absolute")
            .style("top", parent.y + "px")
            .style("opacity", 0)
            .style("height", tree.nodeHeight() + "px")
            .on("click", function (d) {
                toggleChildren(d);
                fst.render(d);
                if (selectedData !== d) {
                    selectedData = d;
                    ul.selectAll("li.node").classed("selected", function (d) {
                        return selectedData === d;
                    });
                    var event = {type: "SelectedItemChanged", data: d};
                    // clear all editable flags
                    ul.selectAll("li.node").select(".label").attr("contentEditable", false);
                    console.log(event);
                    fst.fire(event);
                }
            });

        var listWrap = enteredNodes.append("div").classed("line", true);
        var updatedNodes = nodeEls, exitedNodes = nodeEls.exit();
        listWrap.append("span").attr("class", function (d) {
            var icon = d.children ? " fa-chevron-down"
                : d._children ? "fa-chevron-right" : "";
            return "chevron fa " + icon;
        });
   
        //add icons for folder for file
        listWrap.append("span").attr("class", function (d) {
            var icon = d.isDirectory ? "fa-folder"
                : "fa-file";
            return "fa " + icon;
        });
        //add text
        listWrap.append("span").attr("class", "label")
            .html(fst.labelFunction());

        //update chevron direction
        nodeEls.select("span.chevron").attr("class", function (d) {
            var icon = !d.isDirectory ? "" : d.children ? " fa-chevron-down"
                :  "fa-chevron-right";
            return "chevron fa " + icon;
        });
        //update list class
        nodeEls.attr("class", function (d, i) {
            var c = i % 2 === 0 ? "node even" : "node odd";
            if (selectedData && d.path === selectedData.path) {
                c = c.concat(" selected");
            }
            return c;
        });

        if (!noAnimation) {
            updatedNodes = updatedNodes.transition().duration(duration);
        }
        updatedNodes.style("top", function (d) {
            return (d.y - tree.nodeHeight()) + "px";
        }).style("opacity", 1);
        updatedNodes.selectAll(".line").style("left", function (d) { return d.x + "px"; });
        //remove hidden nodes
        exitedNodes.remove();
    };
       
    TreeList.prototype.selectItem = function (path) {
        var fst = this;
        if (!selectedData || selectedData.path !== path) {
            var nodes = d3.select(el).selectAll(".node");
            nodes.classed("selected", function (d) {
                if (d.path === path) {
                    selectedData = d;
                    
                    return true;
                } else {
                    return false;
                }
            });
            //fire selected item changed event
            fst.fire({type: "SelectedItemChanged", data: selectedData});
            
            setTimeout(function () {
                d3.select(el).node().scrollTop = selectedData.y;
            }, duration);
        }
    };
    
   
    TreeList.prototype.getSelectedItem = function () {
        return selectedData;
    };

    TreeList.prototype.renameRoot = function (newName) {
        // we assume here that the first label in the tree is always the project name
        this.renameItem(d3.select(el).select(".label").data()[0], newName);
        d3.select(el).select(".label").text(newName);
    };

    module.exports = TreeList;

});