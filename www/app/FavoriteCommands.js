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
        proofCommands = require("app/util/ProofCommands"),
        Preferences = require("app/prefs/Preferences");
    
    var instance,
        commands,
        FAVORITE_COMMANDS = "favorite commands";
    
    function FavoriteCommands() {
        eventDispatcher(this);
        var _prefCommands = Preferences.get(FAVORITE_COMMANDS) || ["grind", "expand", "inst?", "assert", "split", "lift-if", "skeep", "lemma" ]; 
        commands = {};
        _prefCommands.forEach(function (c) {
            commands[c] = proofCommands.getCommand(c);
        });
    }
    /**
        Utility function to convert a map to an array
        @param {object} map the map to convert
        @returns {Array} the array of elements in the map
    */
    function toList(obj) {
        return Object.keys(obj).map(function (k) {
            return obj[k];
        });
    }
    
    function _save() {
        Preferences.set(FAVORITE_COMMANDS, Object.keys(commands));
    }
    
    /**
     Adds a command to the favorites list if it is not already present
     Fires the "commandadded" event
     @param {object} cmd the command object to add
    */
    FavoriteCommands.prototype.addCommand = function (cmd) {
        if (!commands[cmd.label]) {
            commands[cmd.label] = cmd;
            _save();
            this.fire({type: "commandadded", command: cmd, commands: toList(commands)});
        }
        return this;
    };
    /**
    *Removes a command from the favorites list if it exists
    *Fires the "commandremoved" event
    *@param {object} cmd the command object to remove
    */
    FavoriteCommands.prototype.removeCommand = function (cmd) {
        if (commands[cmd.label]) {
            delete commands[cmd.label];
            _save();
            this.fire({type: "commandremoved", command: cmd, commands: toList(commands)});
        }
        return this;
    };
    /**
     Gets a list of all the commands marked as favorite
     @returns {array} the array of command objects
    */
    FavoriteCommands.prototype.getCommands = function () {
        return toList(commands);
    };
    
    module.exports = {
        getInstance: function () {
            instance = instance || new FavoriteCommands();
            return instance;
        }
    };
});