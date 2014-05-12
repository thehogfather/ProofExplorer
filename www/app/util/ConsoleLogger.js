/**
 * logs messages that show any progress information from server
 * @author Patrick Oladimeji
 * @date 5/9/14 13:52:54 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Handlebars */
define(function (require, exports, module) {
    "use strict";
    
    var template = require("text!app/templates/console.hbs"),
        d3 = require("d3"),
        Backbone = require("backbone");
    
    var ConsoleLoggerView = Backbone.View.extend({
        initialize: function () {
            
        },
        render: function (model) {
            var t = Handlebars.compile(template);
            var content = t(model);
            $("#console-list").append(content);
        }
    });
    
    var instance;
    module.exports = {
        log: function (model) {
            if (!instance) {
                instance = new ConsoleLoggerView();
            }
            instance.render(model);
        }
    };
});
