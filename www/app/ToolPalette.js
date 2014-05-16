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
    
    Handlebars.registerHelper("tool", function (obj) {
        var label = obj.label || obj.command;
        var img = "<img src='css/glyphicons/png/glyphicons_{0}.png'>".format(obj.icon || "unchecked");
        var res = "<div class='tool' title='{2}'><span class='tool-icon'>{0}</span><span class='tool-label'>{1}</span></div>".format(img, label, obj.command);
        return new Handlebars.SafeString(res);
    });

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
        },
        events: {
            "click .tool": "commandClicked"
        },
        commandClicked: function (event) {
            var t = event.currentTarget;
            if (t.nodeName.toLowerCase() === "div") {
                this.trigger("commandclicked", $(".tool-label", t).html(), t.title);
            }
        }
    });
    
    module.exports = {
        create: function () {
            var model = parseCommands(commandsMap);
            return new ToolPaletteView(model);
        }
    };
});
