/**
 * A collection of proof commands for use withing the pvs system
 * @author Patrick Oladimeji
 * @date 4/22/14 15:32:14 PM
 */
/*jshint unused: true, undef: true*/
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, window */
define(function (require, exports, module) {
    "use strict";
    var d3 = require("d3"),
        TreeVis = require("app/TreeVis"),
        proofCommands = require("app/util/ProofCommands"),
        PVSSession = require("app/PVSSession"),
        StatusLogger = require("app/util/StatusLogger"),
        SetupView = require("app/util/SetupView"),
        MenuBar  = require("app/MenuBar"),
        AllCommandsView = require("app/AllCommandsView"),
        favoriteCommands = require("app/FavoriteCommands").getInstance(),
        ToolPalette  = require("app/ToolPalette"),
        strings = require("i18n!nls/strings"),
        CodeMirror = require("cm/lib/codemirror"),
        proofCommandHints = require("app/editor/ProofCommandHints"),
        Alert = require("app/util/Alert");
    
    var draggedCommand,
        targetNodeEvent,
        session,
        proofCommandEditor,
        treeVis, viewportControls;
    var setup = new SetupView();

    function displayError(err) {
        var message = err.message || err.toString();
        Alert.show(message, "danger", ".menu-wrap");
    }
    
    function processCommand(command) {
        if (command && command.trim().length) {
            var icon, iconclass;
            if (command !== "(postpone)" || command !== "(undo)") {
                treeVis.addCommand(session.getActiveState(), command)
                    .then(function (node) {//add spinner
                        icon = node.element.select(".icon .fa");
                        iconclass = icon.attr("class");
                        icon.attr("class", "fa fa-spinner fa-fw");
                    });
            }
            session.sendCommand(proofCommand(command))
                .then(function (res) {
                    console.log(res);
                    if (icon) {icon.attr("class", iconclass); icon = null; }
                    StatusLogger.log(res);
                }).catch(displayError);
        }
    }
    
    function commandClicked(label, cmd) {
        var command = proofCommands.getCommand(cmd);
        if (command.params) {
            proofCommandEditor.setValue(command.command);
            proofCommandEditor.setCursor(0, command.command.length);
            proofCommandEditor.focus();
        } else {
            processCommand(cmd);
        }
    }
    
    function onTreeNodeMouseOver(event) {
        if (draggedCommand) {
            var nodeEl = event.nodeEl;
            nodeEl.style("fill", "orange")
                    .style("opacity", 0.5);
            targetNodeEvent = event;
        }
    }
    
    function onTreeNodeMouseOut(event) {
        if (draggedCommand) {
            var nodeEl = event.nodeEl;
            nodeEl.style("fill", "none");
        }
        targetNodeEvent = null;
    }
    
    function onTreeNodeClicked(event) {
        console.log(event);
    }
    
    function proofCommand(command) {
        return {method: "proof-command", params: [command]};
    }
    
    function reloadToolbox(event) {
        ToolPalette.create(event.commands)
            .on("commandclicked", commandClicked);
    }
    
    function bindToolBoxEvents() {
        favoriteCommands.addListener("commandadded", reloadToolbox)
            .addListener("commandremoved", reloadToolbox);
        d3.select("#prove-formula").on("click", function () {
            var formula = d3.select("#txt-formula").property("value");
            var theoryFile = setup.getSelectedFile();
            var theory = theoryFile.name.split(".")[0];
            var context = theoryFile.parent.path;
            if (formula && theory) {
                session.reset().changeContext(context)
                    .then(function () {
                        return session.typeCheck(theory);
                    }).then(function (res) {
                        StatusLogger.log(res);
                        return session.proveFormula(formula, theory);
                    }).then(function (res) {
                        StatusLogger.log(res);
                        setup.hide();
                    }).catch(displayError);
            }
        });
    }
    
  
    
    function bindEvents() {        
        function _sendCommand(command) {
            processCommand(command);
            //clear the textbox
            proofCommandEditor.setValue("");
        }
        
        treeVis.addListener("mouseover.node", onTreeNodeMouseOver)
            .addListener("mouseout.node", onTreeNodeMouseOut)
            .addListener("click.node", onTreeNodeClicked)
            .addListener("postpone", function (event) {
                session.postponeUntil(event.targetNode.id)
                    .then(function (res) {
                        StatusLogger.log(res);
                    }).catch(displayError);
            }).addListener("transform", function (event) {
                //show scale and translate data
                viewportControls.select(".scale").html("Zoom: " + Math.round(event.scale * 100) + "%");
            });
        
        //add event for free text
        d3.select("#send").on("click", function () {
            var command = proofCommandEditor.getValue();
            _sendCommand(command);
        });
        //create codemirror instance for sending commands
        proofCommandEditor = new CodeMirror(d3.select("#txtCommand").html("").node(), {
            mode: "lisp", lineNumbers: false
        });
        //use a keymap to get the enter key
        proofCommandEditor.addKeyMap({
            Enter: function (cm) {
                _sendCommand(cm.getValue());
            }
        });
        CodeMirror.registerHelper("hint", "proofhint", proofCommandHints);     
    }
     //add listener for window resize so that the height of the components on the interface are properly redistributed
    function windowResized() {
        var c = $("#prooftree-container")[0];
        if (c) {
            var proofTreeHeight = $(c.parentNode).height();
            $("#proofTree").height(proofTreeHeight);
        }
    }
 
    function createLayout() {
        var proofTreeContainerHtml = require("text!app/templates/prooftree.hbs"),
            sequentContainerHtml = require("text!app/templates/sequent-container.hbs");
        
        var topHeight = $(".menu-wrap").height(),
            bodyHeight = $(window).height();
        
        $("#content-layout").height(bodyHeight - topHeight);
        
        var style = "padding: 5px;border: 1px solid #bbbbb; overflow: hidden;";
        $("#content-layout").w2layout({
            name: "content-layout",
            padding: 4,
            panels: [
                {type: "main", size: "50%", resizable: true, content: proofTreeContainerHtml, style: style},
                {type: "bottom", size: "50%", resizable: true, content: sequentContainerHtml, style: style}
            ],
            onResize: windowResized
        });
        
        window.onresize = windowResized;
        windowResized();
    }
    
    function createUI() {
        createLayout();
        reloadToolbox({});
        MenuBar.create()
            .on("menuclicked", function (label) {
                label = label.trim();
                if (label ===  strings.OPEN) {
                    setup.show();
                } else if (label ===  strings.QUIT) {
                    processCommand("(quit)");
                } else if (label === strings.CONFIGURE_FAVORITE_COMMANDS) {
                    AllCommandsView.create();
                }
            });
        setup.render();
        var viewportControlHeight = 40,
            viewportControlWidth = 90;
        
        function createControls() {
            //map the string data to create objects whose command attributes is the string
            var tb = d3.select("svg").insert("g", "g").attr("transform", "translate(0 "  + viewportControlWidth + ")");
            viewportControls = d3.select("svg").insert("g", "g").classed("viewport-control", true);
            viewportControls.append("foreignObject").attr("x", 0).attr("y", 0)
                .attr("width", viewportControlWidth).attr("height", viewportControlHeight)
                .append("xhtml:span").classed("scale", true);
            
            var navGroup = tb.append("g").attr("class", "nav-buttons")
                .append("foreignObject").attr("x" , 0).attr("y", 0).attr("height", 30).attr("width", 150)
                    .append("xhtml:div");
            navGroup.append("i").classed("fa-fw fa fa-reply", true).style("cursor", "pointer")
                .on("click", function () {
                    processCommand("(undo)");
                });
        }
        
        session = new PVSSession();
        session.addListener("treecreated", function (event) {
            treeVis = new TreeVis(event.tree);
            treeVis.initialise(session);
            createControls();
            
            
            treeVis.registerCommandRunner(function (node, command) {
                return session.postponeUntil(node.id)
                    .then(function () {
                        return session.sendCommand(proofCommand(command));
                    }).catch(displayError);
            });
            bindEvents();
        });
        
        bindToolBoxEvents();
    }
    
    module.exports = {
        createUI: createUI
    };
});
