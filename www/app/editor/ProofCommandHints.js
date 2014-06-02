/**
 * Provides codemirror hints for proof commands
 * @author Patrick Oladimeji
 * @date 5/31/14 23:38
 */
/*jshint unused: true, undef: true*/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define*/
define(function (require, exports, module) {
    "use strict";
    var proofCommands = require("app/util/ProofCommands"),
        commandsList = proofCommands.getAllCommands().map(function (c) {
            return c.command;
        }),
        CodeMirror = require("cm/lib/codemirror");
    
    function hint(cm) {
        var cur = cm.getCursor(), token = cm.getTokenAt(cur);
        var word = token.string, start = token.start, end = token.end;
        if (/[^\w$_-]/.test(word)) {
          word = ""; start = end = cur.ch;
        }
        var result = [];
        function add(keywords) {
          for (var name in keywords)
            if (!word || name.lastIndexOf(word, 0) === 0)
              result.push(name);
        }

        add(commandsList);
//        var st = inner.state.state;
//        if (st == "pseudo" || token.type == "variable-3") {
//          add(pseudoClasses);
//        } else if (st == "block" || st == "maybeprop") {
//          add(spec.propertyKeywords);
//        } else if (st == "prop" || st == "parens" || st == "at" || st == "params") {
//          add(spec.valueKeywords);
//          add(spec.colorKeywords);
//        } else if (st == "media" || st == "media_parens") {
//          add(spec.mediaTypes);
//          add(spec.mediaFeatures);
//        }

        if (result.length) {
            return {
              list: result,
              from: CodeMirror.Pos(cur.line, start),
              to: CodeMirror.Pos(cur.line, end)
            };
        }
    }
    
    module.exports = hint;
});