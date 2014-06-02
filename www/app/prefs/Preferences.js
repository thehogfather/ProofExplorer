/**
 * Manages the presistence of preferences inthe application
 * @author Patrick Oladimeji
 * @date 5/31/14 10:22:19 PM
 */
/*jshit unused: true, undef: true*/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require, exports, module) {
    "use strict";
    
    function get(key) {
        var val = localStorage[key];
        try {
            return JSON.parse(val);
        } catch (err) {
            return val;
        }
    }
    
    function set(key, value) {
        localStorage[key] = JSON.stringify(value);
    }
    
    
    module.exports = {
        get: get,
        set: set
    };
});