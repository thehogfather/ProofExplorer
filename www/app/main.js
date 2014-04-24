/**
 * 
 * @author Patrick Oladimeji
 * @date 4/17/14 8:57:35 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3, require, $, brackets, window, MouseEvent */
define(function (require, exports, module) {
    "use strict";
    
    var comm = require("app/PVSComm");
    var UI       = require("app/UserInterface"),
        PVSSession = require("app/PVSSession");
    UI.createUI();
    
     //declare list of proof commands
    var grind = "(grind)",
        skosimp_star = "(skosimp*)",
        assert = "(assert)";
    
   
    
    
//    comm.sendCommand(changeContext)
//        .then(function (res) {
//            console.log(res);
//            return comm.sendCommand(typeCheck);
//        }).then(function (res) {
//            console.log(res);
//            return comm.sendCommand(proveFormula);
//        })
//        .then(function (res) {
//            console.log(res);
//            return comm.sendCommand(grindCommand);
//        })
//        .then(function (res) {
//            console.log(res);
//            return comm.sendCommand(proofCommand('(case "2=0")'));
//        })
//        .then(function (res) {
//            console.log(res);
//            return comm.sendCommand(proofCommand('(case "1=0")'));
//        }).then(function (res) {
//            console.log(res);
//            return comm.sendCommand(proofCommand("(postpone) (postpone)"));
//        }).then(function (res) {
//            console.log(res);
//        });
});
