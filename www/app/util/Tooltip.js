/**
 * 
 * @author Patrick Oladimeji
 * @date 5/10/14 21:51:36 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Handlebars */
define(function (require, exports, module) {
    "use strict";
    
    var Backbone = require("backbone"),
        template  = require("text!app/templates/tooltip.hbs");
        
    var TooltipView = Backbone.View.extend({
        initialize: function () {
        },
        render: function (data, pos) {
            var t = Handlebars.compile(template);
            var html = t(data);
            //adjust x and y based on cursor position relative to the screen
            pos.x = pos.x + 20;
            this.$el.html(html);
            this.$el.addClass("alert-tooltip");
            this.$el.css({
                "top": pos.y + "px",
                "left": pos.x + "px",
                "position": "absolute",
                "display": "block",
                "z-index": 4
            });
            $("body").append(this.$el);
            return this;
        },
        events: {
            "onblur pre.formula" :"focusout"
        },
        focusout: function (event) {
            event.preventDefault();
        }
    });
    module.exports = TooltipView;
});