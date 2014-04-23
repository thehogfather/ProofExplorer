/**
 * 
 * @author Patrick Oladimeji
 * @date 4/23/14 14:15:35 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    var RandomTreeGenerator = require("app/RandomTreeGenerator");
    
    var currentProvider;
    
    module.exports = {
        getInstance : function () {
            if (!currentProvider) {
                currentProvider = RandomTreeGenerator;
            }
            return currentProvider;
        }
    };
    
});
