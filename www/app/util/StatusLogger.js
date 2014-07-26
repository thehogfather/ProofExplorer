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
    
    var el = "#current-sequent";
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

	function createCodeMirror(el) {
		return  CodeMirror.fromTextArea(el, {
			readOnly: true,
			mode: "pvs",
			foldGutter: true,
			lineNumbers: false,
			gutters: ["CodeMirror-foldgutter"]
		});
	}
	
    function createDeclWidget(name) {
        var text = document.createTextNode(name);
        var widget = document.createElement("span");
        widget.appendChild(text);
        widget.className = "decl";
        return widget;
    }
    
	function decorateWithNamesInfo(cm, namesInfo) {
		namesInfo.forEach(function (ni) {
            var from = {line: ni.place[0] - 1, ch: ni.place[1]},
                to = {line: ni.place[2] - 1, ch: ni.place[3]};
            var text = cm.getRange(from, to);
            var widget = createDeclWidget(text);
			cm.markText(from, to,
						{replacedWith: widget, handleMouseEvents: true});
            CodeMirror.on(widget, "mousedown", function () {
               console.log(text); 
            });
            
            $(widget).attr({"data-toggle": "tooltip", "data-placement": "top", "title": ni.decl})
                .on("mouseover", function () {
                    $(this).addClass("hover");
                }).on("mouseout", function () {
                    $(this).removeClass("hover");
                });
            
		});
	}
	
    var StatusView = Backbone.View.extend({
        el: el,
        initialize: function (data) {
            this.render(data);
        },
        render: function (data) {
            var t = Handlebars.compile(template);
            this.$el.html(t(data.jsonrpc_result));
            var h = window.outerHeight - $("#console").height(), cm, namesInfo;
            $(".content", this.el).css("height", h + "px");
            //add codemirror to view the formula
            if ($(".formula", this.el)) {
                $(".antecedents .formula", this.el).each(function (n, el) {
					cm = createCodeMirror(el);
					//mark the texts using the names info data
					namesInfo = data.jsonrpc_result.result.sequent.antecedents[n]["names-info"];
					decorateWithNamesInfo(cm, namesInfo);
                });
				$(".succedents .formula", this.el).each(function (n, el) {
					cm = createCodeMirror(el);
					namesInfo = data.jsonrpc_result.result.sequent.succedents[n]["names-info"];
					decorateWithNamesInfo(cm, namesInfo);
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
