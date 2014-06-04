/**
 * Shows dismissable alerts to user
 * @author Patrick Oladimeji
 * @date 6/3/14 9:24:54 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $,Handlebars */
define(function (require, exports, module) {
    "use strict";
    
    var template = require("text!app/templates/alert.hbs"),
        Backbone = require("backbone"),
        strings = require("i18n!nls/strings");
    
    var AlertView = Backbone.View.extend({
        initialize: function () {
            
        },
        render: function (message, type, el) {
            var t = Handlebars.compile(template);
            var content = t({type: type, header: strings.ERROR_TEXT, message: message});
            $(el).append(content);
        }
    });
    
    var instance;
    module.exports = {
        show: function (message, type, el) {
            type = type || "danger";
            el = el || "body";
            if (!instance) {
                instance = new AlertView();
            }
            instance.render(message, type, el);
        }
    };
});
