/**
 * 
 * @author Patrick Oladimeji
 * @date 4/17/14 8:57:35 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    
    var treedata = require("app/proofTree");
    var treeVis  = require("app/TreeVis");
    
    var tree = treedata.getTreeData(3, 4);
    treeVis.render(tree);
});
