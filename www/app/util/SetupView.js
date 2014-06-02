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
        template  = require("text!app/templates/setup.hbs"),
        strings = require("i18n!nls/strings");
        
    var SetupView = Backbone.View.extend({
        initialize: function () {
        },
        render: function () {
            var t = Handlebars.compile(template);
            var html = t(strings);
            //adjust x and y based on cursor position relative to the screen
            this.$el.html(html);
            this.$el.addClass("dialog");
            this.$el.css({
                "z-index": 4
            });
            $("body").append(this.$el);
            return this;
        },
        hide: function () {
            this.$el.hide();
        },
        show: function () {
            this.$el.show();
        }
    });
    module.exports = SetupView;
});