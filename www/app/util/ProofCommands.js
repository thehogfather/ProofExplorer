/**
 * Collection of proof commands and the colors attributed to them
 * @author Patrick Oladimeji
 * @date 4/23/14 9:30:37 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/
define(function (require, exports, module) {
    "use strict";
    var commandsHeirarchy = require("text!app/templates/commandHeirarchy.json");
    var navCommands = [{label: "undo", icon: "fa-reply", command:"(undo)"}];

    ///FIXME restructure these functions for efficiency
    var allCommands = (function (str) {
        var json = JSON.parse(str);
        return Object.keys(json).map(function (key) {
            return json[key];
        }).reduce(function (a, b) { return a.concat(b); });
        
    }(commandsHeirarchy));
    
    var commandsMap = (function (str) {
        var json = JSON.parse(str);
        var allCommands = Object.keys(json).map(function (key) {
            return json[key];
        }).reduce(function (a, b) { return a.concat(b); });
        var res = {};
        allCommands.forEach(function (obj) {
            res[obj.command] = res[obj.label] = obj;
        });
        return res;
    }(commandsHeirarchy));
    
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
        getCommand: function (label) {
            return commandsMap[label];
        },
        getColor: function (/*command*/) {
            return "#bbb";// colors(commands.indexOf(command));
        },
        getNavCommands: function () {
            return navCommands;
        },
        getIcon: function (label) {
            return iconsMap[label];
        },
        getAllCommands: function () {
            return allCommands;
        }
    };
});
