/**
 * Manages the command view
 * @author Patrick Oladimeji
 * @date 5/9/14 9:30:30 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, Handlebars*/
define(function (require, exports, module) {
    "use strict";

    var commandsMap = require("text!app/templates/menu.hbs"),
        template = require("text!app/templates/menubar.hbs"),
        strings = require("i18n!nls/strings"),
        Backbone = require("backbone");
    
    function parseCommands(str) {
        var commands = JSON.parse(str);
        var json = Object.keys(commands).map(function (name) {
            return {label: name, children: commands[name]};
        });
        return json;
    }
    
    var MenuBar = Backbone.View.extend({
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
                this.trigger("menuclicked", t.innerText, t.title);
            }
        }
    });
    
    module.exports = {
        create: function () {
            var menuTemplate = Handlebars.compile(commandsMap);
            var menuStr = menuTemplate(strings);
            var model = parseCommands(menuStr);
            return new MenuBar(model);
        }
    };
});
