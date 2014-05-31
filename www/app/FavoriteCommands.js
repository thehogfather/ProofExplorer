/**
 * A module to manage the currently active commands in the list of favorites
 * @author Patrick Oladimeji
 * @date 5/29/14 21:51:36 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";
    var eventDispatcher = require("app/util/eventDispatcher"),
        proofCommands = require("app/util/ProofCommands");
    
    var instance,
        commands;
    
    function FavoriteCommands() {
        eventDispatcher(this);
        commands = {"grind": proofCommands.getCommand("grind")};
    }
    
    function toList(obj) {
        return Object.keys(obj).map(function (k) {
            return obj[k];
        });
    }
    
    FavoriteCommands.prototype.addCommand = function (cmd) {
        if (!commands[cmd.label]) {
            commands[cmd.label] = cmd;
            this.fire({type: "commandadded", command: cmd, commands: toList(commands)});
        }
        return this;
    };
    
    FavoriteCommands.prototype.removeCommand = function (cmd) {
        if (commands[cmd.label]) {
            delete commands[cmd.label];
            this.fire({type: "commandremoved", command: cmd, commands: toList(commands)});
        }
    };
    
    FavoriteCommands.prototype.getCommands = function () {
        return commands;
    };
    
    module.exports = {
        getInstance: function () {
            instance = instance || new FavoriteCommands();
            return instance;
        }
    };
});