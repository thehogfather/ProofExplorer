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
    var UI       = require("app/UserInterface");
    UI.createUI();
    
     //declare list of proof commands
    var grind = "(grind)",
        skosimp_star = "(skosimp*)",
        assert = "(assert)";
    
    function proofCommand(command) {
        return {method: "proof-command", params: [command]};
    }
    
    var examples = "/home/chimed/pvs-github/ProofExplorer/examples";
    var changeContext = {method: "change-context", params: [examples], id: new Date().getTime()},
        typeCheck = {method: "typecheck", params: ["predictability_th"]},
        proveFormula = {method: "prove-formula", params: ["dn_button_predictable", "predictability_th"]},
        grindCommand = proofCommand(grind);
    
    
    comm.sendCommand(changeContext)
        .then(function (res) {
            console.log(res);
            return comm.sendCommand(typeCheck);
        }).then(function (res) {
            console.log(res);
            return comm.sendCommand(proveFormula);
        }).then(function (res) {
            console.log(res);
            return comm.sendCommand(grindCommand);
        }).then(function (res) {
            console.log(res);
        });
});
