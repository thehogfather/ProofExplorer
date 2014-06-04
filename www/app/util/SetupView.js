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
        strings = require("i18n!nls/strings"),
        d3 = require("d3"),
        ws = require("app/WebSocketClient").getInstance(),
        RemoteFileBrowser = require("app/fs/RemoteFileBrowser");
    var rfb;
    var SetupView = Backbone.View.extend({
        initialize: function (context) {
            this.defaultContext = context || "../examples";
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
            rfb = new RemoteFileBrowser(this.defaultContext, "#remote-files");
            rfb.addListener("SelectedItemChanged", function (event) {
                d3.select("datalist#theorems").html("");
                d3.select("#prove-formula").property("value", "");
                //reload theorems into datalist
                if (event.data.name.split(".")[1] === "pvs") {
                    ws.send({type: "getTheorems", filePath: event.data.path}, function (err, res) {
                        if (!err) {
                            d3.select("datalist#theorems").selectAll("option").data(res.theorems).enter()
                                .append("option").attr("value", function (d) { return d; });
                        }
                    });
                }
            });
            return this;
        },
        hide: function () {
            this.$el.hide();
        },
        events: {
            "blur #txt-context": "rebaseDir",
            "click #cancel": "hide",
            "click #prove-formula": "proveFormula"
        },
        proveFormula: function () {
            //do any validation and trigger event
            this.trigger("proveformula", $("#txt-formula")[0].value, rfb.getSelectedFile().name);
        },
        show: function () {
            this.$el.show();
        },
        rebaseDir: function (event) {
            rfb.reBase(event.target.value);
        },
        getSelectedFile: function () {
            return rfb.getSelectedFile();
        }
    });
    module.exports = SetupView;
});