/**
 * Manages the command view
 * @author Patrick Oladimeji
 * @date 5/9/14 9:30:30 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, Handlebars*/
define(function (require, exports, module) {
    "use strict";

    var commandsMap = require("text!app/templates/commandHeirarchy.json"),
        template = require("text!app/templates/commandMenus.hbs"),
        Backbone = require("backbone");
    
    function parseCommands(str) {
        var commands = JSON.parse(str);
        var json = Object.keys(commands).map(function (name) {
            var children = commands[name];
            children.forEach(function (d) {
               d.icon = d.icon || "unchecked"; 
            });
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
            var t = event.currentTarget;
            if (t.nodeName.toLowerCase() === "li") {
                this.trigger("commandclicked", t.innerText, t.title);
            }
        }
    });
    
    module.exports = {
        create: function () {
            var model = parseCommands(commandsMap);
            return new CommandsMenuView(model);
        }
    };
});
