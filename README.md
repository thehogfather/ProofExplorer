#Proof Explorer for PVS
This project is a front end for interacting with [PVS](http://pvs.csl.sri.com/) especially for visualisation and manipulation of proof trees in the PVS system. This project is a work in progress.

###Features include
1. Visual representation of proof tree
2. Collapse and expand proof tree branches
3. Drag and drop proof commands between branches.


###Requirements
* The communication with the PVS xmlrpc server requires [nodejs](http://nodejs.org/download/)
* PVS server. This can be obtained by compiling the latest version of [PVS](https://github.com/samowre/PVS)

###Installation instructions
* clone the repository by running `git clone https://github.com/thehogfather/ProofExplorer` or download a zip of the latest version from [here](https://github.com/thehogfather/ProofExplorer/archive/master.zip) and extract the contents.
* change directory into the downloaded repository by running `cd ProofExplorer`
* install the server node libraries by running

	`cd server
	`npm install

###How to run
* Start the PVS server using the --port option e.g. `pvs --port 22334
* From the server directory, start the proof explorer server by running `node rpc-client.js` or run `start.sh`
* Open a Chrome browser and navigate to [http://localhost:8083](http://localhost:8083)

![Screenshot](screenshot.png?raw=true)
This project has the following setup:

* www/ - the client side code for the project
    * index.html - the entry point into the app.
    * app.js - the top-level config script used by index.html
    * app/ - the directory to store project-specific scripts.
    * lib/ - the directory to hold client side third party scripts.
* tools/ - the build tools to optimize the project.
* server/ - the server side code for the project. This handles communication with PVS.
