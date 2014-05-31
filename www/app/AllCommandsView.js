/**
 * 
 * @author Patrick Oladimeji
 * @date 5/12/14 14:16:19 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Handlebars */
define(function (require, exports, module) {
    "use strict";
    var Backbone = require("backbone"),
        template = require("text!app/templates/allproofcommands.hbs"),
        commandsMap = require("text!app/templates/commandHeirarchy.json"),
        favoriteCommands = require("app/FavoriteCommands").getInstance(),
        proofCommands = require("app/util/ProofCommands");

    function parseCommands(str) {
        var commands = JSON.parse(str);
        var json = Object.keys(commands).map(function (name) {
            return {label: name, children: commands[name], id: name.replace(/[\s\,]/g, "_")};
        });
        return json;
    }
    
    var AllCommandsView = Backbone.View.extend({
        initialize: function (model) {
            this.model = model;
            this.render(model);
        },
        render: function (model) {
            var t = Handlebars.compile(template);
            var html = t(model);
            this.$el.addClass("dialog");
            this.$el.html(html);
            $("body").append(this.$el);
            //check the values in the favorites list
            var labels = Object.keys(favoriteCommands.getCommands()).map(function (label) { return label; });
            $("div.tool").each(function () {
                var l = $(".tool-label", this).text();
                $("input[type='checkbox']", this).prop("checked", labels.indexOf(l.trim()) > -1);
            });
            return this;
        },
        events: {
            "click .tool": "commandClicked",
            "change input[type='checkbox']": "favoritesChanged",
            "click #close": "close"
        },
        close: function () {
            this.remove();
        },
        favoritesChanged: function (event) {
            var p = event.target.parentElement.parentElement;
            var command = proofCommands.getCommand($(".tool-label", p).text());
            if (event.target.checked) {
                favoriteCommands.addCommand(command);
            } else {
                favoriteCommands.removeCommand(command);
            }
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
            return new AllCommandsView(model);
        }
    };
});
