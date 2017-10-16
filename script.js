///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var canvasWidth = 750;
var canvasHeight = 750;
var zoomPowerConstant = 1.1; //This is used when calculating the zoom factor when scrolling.
var mouseWheelCalibrationConstant = 53; //This is the value given when the mouse is scrolled one notch.
var axisColors = ["#ff0000", "#00cc00", "#0000ff"]; //The colors of the axes shown about global zero.
var dragRotatingConstant = 1/100; //This constant slows down the rate that dragging rotates the graph.
var dragPanningConstant = 1/40; //This constant slows down the rate that dragging pans the graph.
var rotateCheckButtonSpeed = 25; //How often the program checks if the rotate button is still pressed, in milliseconds.
var rotateDegreesPerTick = 1.5; //How many degrees the view rotates per tick.
var mouseDeltasToKeep = 8; //How many of the last mouse movements to keep recorded for panning/rotating.

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var html = {};
var pointCloud = [];
var viewVector = [];
var viewBasis = [];
var cameraLocation = [];

///////////////////////////////////////////
/// CLASSES
///////////////////////////////////////////



///////////////////////////////////////////
/// FUNCTIONS
///////////////////////////////////////////

function setup() {
	html.canvas = document.getElementById("display");
	html.pcInput = document.getElementById("pcInput");
	html.pcInputButton = document.getElementById("pcInputButton");
	html.startButton = document.getElementById("start");
	html.stopButton = document.getElementById("stop");

	html.canvas.setAttribute("width", String(canvasWidth) + "px");
	html.canvas.setAttribute("height", String(canvasHeight) + "px");

	html.pcInputButton.addEventListener("click", newPointCloud);
}
function newPointCloud() {
	//Get and preprocess the raw input.
	var rawInput = html.pcInput.value;
	var splitInput = rawInput.split("[");
	splitInput.shift();

	//Try to store the values from the raw input into a point cloud type array.
	var pc = [];
	try {
		for(var i=0; i<splitInput.length; ++i) {
			pc.push([]);
			pc[i].push(Number(splitInput[i].substr(0, 1)));
			pc[i].push(Number(splitInput[i].substr(2, 1)));
			pc[i].push(Number(splitInput[i].substr(4, 1)));
		}
	}
	catch(e) {
		alert("Invalid point cloud syntax!");
		return;
	}

	//Make sure all of the entries are numbers and aren't NaN.
	for(var i=0; i<pc.length; ++i) {
		for(var j=0; j<pc[i].length; ++j) {
			if(typeof pc[i][j] != "number") {
				alert("Invalid point cloud syntax!");
				return;
			}
			if(isNaN(pc[i][j])) {
				alert("Invalid point cloud syntax!");
				return;
			}
			if(pc[i][j] == Infinity) {
				alert("Don't use infinity. Seriously, what were you expecting?");
				return;
			}
		}
	}

	//All is good; output pc into pointCloud.
	//Because the function returns if there's an error, this statement is only read if everything is valid.
	//So you don't replace the current point cloud with a faulty one.
	pointCloud = pc.slice(0);
}

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();