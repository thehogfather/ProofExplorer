#Proof Explorer for PVS
This project is a front end for interacting with [PVS](http://pvs.csl.sri.com/) especially for visualisation and manipulation of proof trees in the PVS system.

###Features include
1. Visual representation of proof tree
2. Collapse and expand proof tree branches
3. Drag and drop proof commands between branches.

This web project has the following setup:

* www/ - the web assets for the project
    * index.html - the entry point into the app.
    * app.js - the top-level config script used by index.html
    * app/ - the directory to store project-specific scripts.
    * lib/ - the directory to hold third party scripts.
* tools/ - the build tools to optimize the project.

To optimize, run:

    node tools/r.js -o tools/build.js

That build command creates an optimized version of the project in a
**www-built** directory. The app.js file will be optimized to include
all of its dependencies.
