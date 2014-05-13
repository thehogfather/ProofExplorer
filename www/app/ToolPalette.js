/**
 * 
 * @author Patrick Oladimeji
 * @date 5/12/14 14:16:19 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Handlebars */
define(function (require, exports, module) {
    "use strict";
    var Backbone = require("backbone"),
        template = require("text!app/templates/toolpalette.hbs"),
        commandsMap = require("text!app/templates/commandHeirarchy.json");
    
    function parseCommands(str) {
        var commands = JSON.parse(str);
        var json = Object.keys(commands).map(function (name) {
            return {label: name, children: commands[name], id: name.replace(/[\s\,]/g, "_")};
        });
        return json;
    }
    
    var ToolPaletteView = Backbone.View.extend({
        el: "#toolPalette",
        initialize: function (model) {
            this.model = model;
            this.render(model);
        },
        render: function (model) {
            var t = Handlebars.compile(template);
            var html = t(model);
            this.$el.html(html);
            return this;
        }
    });
    
    module.exports = {
        create: function () {
            var model = parseCommands(commandsMap);
            return new ToolPaletteView(model);
        }
    };
});
