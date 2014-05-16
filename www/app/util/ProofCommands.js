/**
 * Collection of proof commands and the colors attributed to them
 * @author Patrick Oladimeji
 * @date 4/23/14 9:30:37 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3");
    var commandsHeirarchy = require("text!app/templates/commandHeirarchy.json");
    var colors = d3.scale.category20();
    var commands = ['(case "1=0")', "(grind)", "(split)", "(skeep)", "(postpone)", "(undo)"];
    var maxChildren = [9, 2, 1, 1];
    
    var iconsMap =  (function (str) {
        var json = JSON.parse(str);
        var allCommands = Object.keys(json).map(function (key) {
            return json[key];
        }).reduce(function (a, b) { return a.concat(b); });
        var res = {};
        allCommands.forEach(function (obj) {
            res[obj.command] = obj.icon;
            res[obj.label] = obj.icon;
        });
        return res;
    }(commandsHeirarchy));
    
    module.exports = {
        getColor: function (command) {
            return colors(commands.indexOf(command));
        },
        getCommands: function () {
            return commands;
        },
        getMaxChildren: function (cmd) {
            return maxChildren[commands.indexOf(cmd)];
        },
        getIcon: function (label) {
            return iconsMap[label];
        }
    };
});
