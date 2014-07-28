/**
 *
 * @author hogfather
 * @date Mar 9, 2012
 * @project JSLib
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define([], function () {
    "use strict";
    /**
     * function for recursively copying an object chain into a new object
	 * source is from http://my.opera.com/GreyWyvern/blog/show.dml/1725165
	 * @param {object} obj the object to copy
	 * @param {array<string>} ignoreList an array of property names to ignore e.g., 
	 * useful to not deepcopy the parent property of node in a tree
	 * @returns {object} copied object
     */
    return function (obj, ignoreList) {
        function deepcopy(obj) {
            if (obj === undefined || obj === null) {
                return obj;
            }
            var newObj = (obj instanceof Array) ? [] : {};
            Object.keys(obj).filter(function (d) {
                return ignoreList ? ignoreList.indexOf(d) < 0 : true;
            }).forEach(function (key) {
                if (obj[key] && typeof obj[key] === "object") {
                    newObj[key] = deepcopy(obj[key]);
                } else {
                    newObj[key] = obj[key];
                }
            });
            return newObj;
        }

        return deepcopy(obj);
    };
});