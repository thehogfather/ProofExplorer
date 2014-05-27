/**
 * Logs the status of the session to the user interface
 * @author Patrick Oladimeji
 * @date 5/5/14 8:40:53 AM
 */
/*jshint unused: true, undef: true*/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window, Handlebars */
define(function (require, exports, module) {
    "use strict";
    
    var el = "#status";
    var Backbone = require("backbone"),
        template  = require("text!app/templates/status.hbs"),
        CodeMirror = require("cm/lib/codemirror");
    
    require("cm/addon/fold/foldcode");
    require("cm/addon/fold/foldgutter");
    require("cm/addon/fold/indentFold");
    require("cm/mode/pvs/pvs");
    
    Handlebars.registerHelper("sequentLabel", function (obj) {
        var open = obj.changed  === "true" ? "{" : "[",
            close = obj.changed === "true" ? "}" : "]";
        var str = "{0}{2}{1}:".format(open, close, obj.labels[0]);
        return str;
    });

    var StatusView = Backbone.View.extend({
        el: el,
        initialize: function (data) {
            this.render(data);
        },
        render: function (data) {
            var t = Handlebars.compile(template);
            this.$el.html(t(data.jsonrpc_result));
            var h = window.outerHeight - $("#console").height();
            $(".content", this.el).css("height", h + "px");
            //add codemirror to view the formula
            if ($(".formula", this.el)) {
                $(".formula", this.el).each(function (n, el) {
                    CodeMirror.fromTextArea(el, {
                        mode: "pvs",
                        foldGutter: true,
                        lineNumbers: false,
                        gutters: ["CodeMirror-foldgutter"]
                    });
                });
            }
            return this;
        }
    });
    
    module.exports = {
        log: function (obj) {
            return new StatusView(obj);
        }
    };
});
