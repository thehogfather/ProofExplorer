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
        template  = require("text!app/templates/status.hbs"),
        ace = require("ace/ace");
    
    Handlebars.registerHelper("sequentLabel", function (obj) {
        var open = obj.changed  === "true" ? "{" : "[",
            close = obj.changed === "true" ? "}" : "]";
        var str = "{0}{2}{1}:".format(open, close, obj.labels[0]);
        return str;
    });

    var StatusView = Backbone.View.extend({
        initialize: function (data) {
            this.render(data);
        },
        render: function (data) {
            var t = Handlebars.compile(template);
            d3.select(el).html(t(data.jsonrpc_result));
            var h = window.outerHeight - $("#console").height();
            d3.select("#status .content").style("height", h + "px");
            //enable ace editor viewer for each sequent
//            d3.select(el).selectAll(".formula")
//                .each(function () {
//                    var editor = ace.edit(this);
//                    editor.setReadOnly(true);
//                    editor.renderer.setShowPrintMargin(false);
//                    editor.renderer.setShowGutter(false);
//                    editor.renderer.setDisplayIndentGuides(false);
//                    //dynamically set the height of the 
                   
//                });
        }
    });
    
    module.exports = {
        log: function (obj) {
            return new StatusView(obj);
        }
    };
});
