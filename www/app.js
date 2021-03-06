/**
 * 
 * @author Patrick Oladimeji
 * @date 4/21/14 13:42:21 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global requirejs */
requirejs.config({
    baseUrl: 'lib',
    paths: {
        app: '../app',
        nls: "../app/nls"
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['app/main'], function (main) {
    main();
});
