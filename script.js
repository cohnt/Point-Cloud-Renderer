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
var defaultViewVector = [1, 1, 1];

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var html = {};
var pointCloud = [];
var viewVector = [];
var viewBasis = [[], [], []];
var cameraLocation = [];
var keys = {};
var overCanvas = false;

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

	//Controls for moving and adjusting the "camera".
	document.addEventListener("keydown", function(event) { keydown(event); });
	document.addEventListener("keyup", function(event) { keyup(event); });
	document.addEventListener("mousemove", function(event) { mouseMoved(event); });
	html.canvas.addEventListener("mousedown", function(event) { mousedown(event); });
	document.addEventListener("mouseup", function(event) { mouseup(event); });
	html.canvas.addEventListener("wheel", function(event) { wheel(event); });
	html.canvas.addEventListener("mouseenter", function(event) { mouseEnterCanvas(event); });
	html.canvas.addEventListener("mouseleave", function(event) { mouseLeaveCanvas(event); });

	viewVector = defaultViewVector.slice(0);
	updateBasis();
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
function keydown(e) {
	if(event.which == 81 && !keys[String(81)] && overCanvas) { //Q
		rotateCamera(-1*rotateDegreesPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
	}
	else if(event.which == 69 && !keys[String(69)] && overCanvas) { //E
		rotateCamera(rotateDegreesPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
	}
	keys[String(event.which)] = true;
}
function rotatingCheckAgain() {
	if(keys[String(81)] && overCanvas) {
		rotateCamera(-1*rotateDegreesPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
	}
	else if(keys[String(69)] && overCanvas) {
		rotateCamera(rotateDegreesPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
	}
	updateGraphDisplay();
}
function keyup(e) {
	//
	keys[String(event.which)] = false;
}
function mouseMoved(e) {
	//Needs to be rewritten.
}
function mousedown(e) {
	//
	mouseButtons[String(event.which)] = true;
}
function mouseup(e) {
	//
	mouseButtons[String(event.which)] = false;
}
function mouseEnterCanvas(e) {
	//
	overCanvas = true;
}
function mouseLeaveCanvas(e) {
	//
	overCanvas = false;
}
function wheel(e) {
	//Needs to be rewritten.
}
function rotateCamera(deg) {
	var rotationAxis = viewBasis[2].slice(0); //We rotate around the view axis, which is the third axis in the basis.
	var t = (Math.PI/180)*deg*-1; //The -1 multiplier accounts for the fact that the view axis is actually pointing towards us.
	var ux = rotationAxis[0]; var uy = rotationAxis[1]; var uz = rotationAxis[2];
	var rotationMatrix = [
		[ cos(t)+(sq(ux)*(1-cos(t))), (ux*uy*(1-cos(t)))-(uz*sin(t)), (ux*uz*(1-cos(t)))+(uy*sin(t)) ],
		[ (uy*ux*(1-cos(t)))+(uz*sin(t)), cos(t)+(sq(uy)*(1-cos(t))), (uy*uz*(1-cos(t)))-(ux*sin(t)) ],
		[ (uz*ux*(1-cos(t)))-(uy*sin(t)), (uz*uy*(1-cos(t)))+(ux*sin(t)), cos(t)+(sq(uz)*(1-cos(t))) ]
	]; //Many thanks to wikipedia: https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle
	viewBasis = mm(rotationMatrix, viewBasis).slice(0);
}
function updateBasis() {

}
function mm(a, b) {
	//Return c=a*b where a and b are matrices. If their dimensions mismatch, return false;
	if(a[0].length != b.length) {
		return false;
	}
	var c = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
	for(var i=0; i<a.length; ++i) {
		for(var j=0; j<a[i].length; ++j) {
			for(var k=0; k<a[i].length; ++k) {
				c[i][j] += a[i][k]*b[k][j];
			}
		}
	}
	return c;
}
function sin(x) { return Math.sin(x); }
function cos(x) { return Math.cos(x); }
function sq(x) { return x*x; }

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();