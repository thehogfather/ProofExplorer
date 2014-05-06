/**
 * Logs the status of the session to the user interface
 * @author Patrick Oladimeji
 * @date 5/5/14 8:40:53 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, Handlebars */
define(function (require, exports, module) {
    "use strict";
    
    var el = "#status";
    var Backbone = require("backbone"),
        d3 = require("d3"),
        template  = require("text!app/templates/status.hbs");
    
    Handlebars.registerHelper("cedent", function (obj) {
        var open = obj.changed  === "true" ? "{" : "[",
            close = obj.changed === "true" ? "}" : "]";
        var str = "{0}{2}{1}: {3}".format(open, close, obj.labels[0], obj.formula); 
        return str;
    });
    
    var StatusView = Backbone.View.extend({
        initialize: function (data) {
            this.render(data);
        },
        render: function (data) {
            var t = Handlebars.compile(template);
            d3.select(el).html(t(data.jsonrpc_result));
        }
    });
    
    module.exports = {
        log: function (obj) {
            return new StatusView(obj);
        }
    };
});
