/**
 * 
 * @author Patrick Oladimeji
 * @date 4/23/14 15:22:09 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3");
    
    module.exports = {
        getChildren: function (pvsJson) {
            var res = pvsJson.jsonrpc_result.result, data;
            var childCount = res["num-subgoals"], current;
            if (!isNaN(childCount)) {
                
                data = d3.range(0, childCount).map(function (d, i) {
                    
                });
            } else {
                data = [{id: res.label, data: res}];
            }
        }
    };
});
