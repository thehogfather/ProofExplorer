/**
 * Manages the command view
 * @author Patrick Oladimeji
 * @date 5/9/14 9:30:30 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Handlebars*/
define(function (require, exports, module) {
    "use strict";

    var commandsMap = require("text!app/templates/commandHeirarchy.json"),
        template = require("text!app/templates/commandMenus.hbs"),
        d3 = require("d3"),
        StatusLogger = require("app/util/StatusLogger"),
        Backbone = require("backbone");
    
    var session;
    function parseCommands(str) {
        var commands = JSON.parse(str);
        var json = Object.keys(commands).map(function (name) {
            return {label: name, children: commands[name]};
        });
        return json;
    }
    
    var CommandsMenuView = Backbone.View.extend({
        el: "#menubar",
        initialize: function (model) {
            this.render(model);
        },
        render: function (model) {
            var t = Handlebars.compile(template);
            var content = t(model);
            this.$el.html(content);
            return this;
        },
        events: {
            "click li": "commandClicked"
        },
        commandClicked: function (event) {
            this.trigger("commandclicked", event.target.innerHTML);
        },
        sendCommand: function (event) {
            session.sendCommand(event.target.innerHTML)
                .then(function (res) {
                    StatusLogger.log(res);
                });
        }
    });
    
    module.exports = {
        create: function (_session) {
            session = _session;
            var model = parseCommands(commandsMap);
            return new CommandsMenuView(model);
        }
    };
});
