/**
 * 
 * @author Patrick Oladimeji
 * @date 5/10/14 21:51:36 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Handlebars */
define(function (require, exports, module) {
    "use strict";
    
    var el = "#tooltip";
    var Backbone = require("backbone"),
        d3 = require("d3"),
        template  = require("text!app/templates/tooltip.hbs");
        
    var TooltipView = Backbone.View.extend({
        initialize: function () {
        },
        render: function (data, pos) {
            var t = Handlebars.compile(template);
            var html = t(data);
            //adjust x and y based on cursor position relative to the screen
            pos.x = pos.x + 20;
            d3.select(el).html(html)
                .attr("class", "popover")
                .style("top", pos.y + "px")
                .style("left", pos.x + "px")
                .style("position", "absolute")
                .style("display", "block");
        },
        hide: function () {
            d3.select(el).html("").style("position", null).classed("popover", false);
        },
        html: function (data, pos) {
            var t = Handlebars.compile(template);
            var html = t(data);
            return html;
        }
    });
    var instance = new TooltipView();
    module.exports = {
        show: function (obj, pos) {
            instance.render(obj, pos);
        },
        hide: function () {
            instance.hide();
        },
        html: function (obj) {
            return instance.html(obj);
        }
    };
});