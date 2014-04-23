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
    
    var colors = d3.scale.category20();
    var commands = ["(grind)", "(split)", "(skeep)"];
    
    module.exports = {
        getColor: function (command) {
            return colors(commands.indexOf(command));
        },
        getCommands: function () {
            return commands;
        }
    };
});
