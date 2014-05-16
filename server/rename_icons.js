/**
 * utility function to rename free glyphicons -- it strips off the numbers from the middle of the file names
 * to facilitate easy search
 * @author Patrick Oladimeji
 * @date 5/14/14 8:24:39 AM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, sloppy: true */
/*global define, d3, require, $, brackets, window, __dirname */
var fs = require("fs"),
    path = require("path");

var folder = path.resolve(__dirname, "../www/css/glyphicons/png");
console.log(folder);
fs.readdir(folder, function (err, files) {
    if (!err) {
        files.forEach(function (filepath) {
            if (filepath.indexOf(".png") > -1) {
                var name = filepath.replace(/\_\d{3}\_/, "_");
                fs.rename(path.join(folder, filepath), path.join(folder, name), function (err) {
                    if (err) {
                        console.log(err);
                        console.log(name);
                    }
                });
            }
        });
    } else {
        console.log(err);
    }
});