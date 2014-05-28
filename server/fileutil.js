(function () {
    var logger = require("tracer").console(),
        Promise = require("es6-promise").Promise,
        fs = require("fs"),
        path = require("path");

    /**
     * Get the stat for the file in the specified path
     * @returns {Promise} a promise that resolves with the stat object of the file
      see http://nodejs.org/api/fs.html#fs_class_fs_stats for details
     */
    function stat(fullPath) {
        return new Promise(function (resolve, reject) {
            fs.stat(fullPath, function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }
    /**
        Recursively reads the files in a directory using promises
        @param {string} fullPath the path to the directory to read
        @param {boolean} getContent a flag to set whehter or not to return the content of the file
        @returns {Promise} a promise that resolves with an array of objects  for the files in the given directory.
            The object may contain just filePath prooperties or may include fileContent if the getContent parameter was passed
    */
    function getFilesInDirectory(fullPath, getContent) {
        logger.debug("reading " + fullPath);
        return stat(fullPath).then(function (f) {
            if (f.isDirectory()) {
                return new Promise(function (resolve, reject) {
                    fs.readdir(fullPath, function (err, files) {
                        if (err) {
                            reject(err);
                        } else {
                            var promises = files.map(function (name) {
                                var filePath = path.join(fullPath, name);
                                return getFilesInDirectory(filePath, getContent);
                            });

                            Promise.all(promises)
                                .then(function (res) {
                                    var flattened = res.reduce(function (a, b) {
                                        if (Array.isArray(b)) {
                                            return a.concat(b);
                                        } else {
                                            a.push(b);
                                            return a;
                                        }
                                    }, []);
                                    resolve(flattened);
                                }, reject);
                        }
                    });
                });
            } else {
                if (!getContent) {
                    return Promise.resolve({filePath: fullPath});
                }
                //resolve with the filename and content
                return new Promise(function (resolve, reject) {
                    fs.readFile(fullPath, function (err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({filePath: fullPath, fileContent: data});
                        }
                    });
                });
            }
        }, function (err) {
            return Promise.reject(err);
        });
    }

    module.exports = {
        getFilesInDirectory: getFilesInDirectory
    };
}());