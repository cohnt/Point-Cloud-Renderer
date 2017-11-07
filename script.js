///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var defaultTransformMatrix = [[1, 0, 0, 0], //The default transformation matrix.
                              [0, 1, 0, 0],
                              [0, 0, 1, -200],
                              [0, 0, 0, 1]];
var axisColors = ["#dd0000", "#dd9999", "#00dd00", "#99dd99", "#0000dd", "#9999dd"]; //The colors of the x+, x-, y+, y-, z+, and z- axes (respectively).
var canvasDimensions = [null, null]; //Populated in setup()
var axisLength = 100; //In pixels.
var defaultLineColor = "#000000"; //Pretty self-explanatory, right?
var rotateRadiansPerTick = (Math.PI*2)*(1/2)*(25/1000); //How many degrees the view rotates per tick.
var rotateCheckButtonSpeed = 25; //How often the program checks if the rotate button is still pressed, in milliseconds.
var translateCheckButtonSpeed = 25; //How often the program checks if the translate button is still pressed, in milliseconds.
var mouseWheelCalibrationConstant = 53; //The delta value of one "notch" on my personal mouse.
var zoomStep = Math.pow(10, (1/10)); //The factor by which it zooms for each discrete mousemove value.
var translatePerTick = 1; //The amount of translation for each tick.
var tiltRadiansPerPixel = Math.PI/256; //How many radians to rotate for each pixel when tilting.
var pointDisplaySize = 2; //In pixels.

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var html = {}; //An object containing every html element on the page.
var context; //The to-be-created 2D canvas context.
var currentTransform; //The current matrix transformation to map a point in the 3D real space to the camera perspective.
var keys = {}; //The current status of any keys that have been pressed during the session. Undefined or false implies the key is not being pressed right now.
var mouseButtons = {}; //The current status of any mouse buttons that have been pressed during the session. Undefined or false implies the button is not being pressed right now.
var overCanvas = false; //Whether or not the mouse pointer is over the canvas.
var mouseLocation = [0, 0]; //Current mouse location (x,y).
var oldMouseLocation = [0, 0]; //Old mouse location (x,y).
var zoom = 1; //Zoom represents frame of view.
var pointCloud = []; //The point cloud being displayed.
var last5FrameTime = []; //The last 5 frame render times, in ms.

///////////////////////////////////////////
/// CLASSES
///////////////////////////////////////////



///////////////////////////////////////////
/// FUNCTIONS
///////////////////////////////////////////

function setup() {
	html.canvas = document.getElementById("screen"); //<canvas id="screen">
	html.currentTransform = []; //Load in the entire table which displays the current transform.
	for(var i=0; i<4; ++i) {
		html.currentTransform.push([]);
		for(var j=0; j<4; ++j) {
			html.currentTransform[i].push(document.getElementById("r"+i+"c"+j)); //Matrix element in row i, column j has id ricj.
		}
	}
	html.pcTextArea = document.getElementById("pointCloud");
	html.load = document.getElementById("newPC");
	html.pointsRendered = document.getElementById("pointsRendered");
	html.frameTime = document.getElementById("frameTime");
	html.frameTime5Avg = document.getElementById("frameTime5Avg");

	document.addEventListener("keydown", function(event) { keydown(event); });
	document.addEventListener("keyup", function(event) { keyup(event); });
	html.canvas.addEventListener("mouseenter", function(event) { mouseEnterCanvas(event); });
	html.canvas.addEventListener("mouseleave", function(event) { mouseLeaveCanvas(event); });
	document.addEventListener("mousemove", function(event) { mouseMoved(event); });
	html.canvas.addEventListener("mousedown", function(event) { mousedown(event); });
	document.addEventListener("mouseup", function(event) { mouseup(event); });
	document.addEventListener("wheel", function(event) { wheel(event); });
	html.load.addEventListener("click", newPC);

	//The raw output of getAttribute is "####px", so we need to shave off the px and parse to a number.
	canvasDimensions[0] = Number(html.canvas.getAttribute("width").slice(0,-2));
	canvasDimensions[1] = Number(html.canvas.getAttribute("height").slice(0,-2));

	context = html.canvas.getContext("2d"); //Create a 2D context.
	metaTransformations();

	loadDefaults();
	reloadDisplay();
}
function loadDefaults() {
	//
	currentTransform = defaultTransformMatrix.slice();
}
function drawPoint(a) {
	//a is a 4x1 column vector, representing a homogeneous coordinate in the real basis.
	var a1 = projectToScreen(a);
	//if(a1[2] < 0) { //If the point is in front of the camera
		            //Recall that with the right-hand-rule, the positive z-axis is pointing towards you.
		context.fillRect(a1[0]-(pointDisplaySize/2), a1[1]-(pointDisplaySize/2), pointDisplaySize, pointDisplaySize); //Draw a "pixel" by drawing a 1x1 rectangle.
		                                      //For some reason, this is the fastest way to do it with canvas.
	//} //It's not actually clear how well this actually works -- there's some confusion with how the camera is working.
	//Something to sort out later.
}
function drawLine(a, b) {
	//Don't use this function in general, since it doesn't check if the points are in front of or behind the camera yet.
	//Once that's implemented, go for it!
	var a1 = projectToScreen(a);
	var b1 = projectToScreen(b);
	context.moveTo(a1[0], a1[1]);
	context.lineTo(b1[0], b1[1]);
}
function projectToScreen(x) {
	//x is a 4x1 column vector representing a homogeneous coordinate in the real basis.
	var x1; //x1 is a 4x1 column vector representing a homogeneous coordinate in the camera basis.
	x1 = mm(currentTransform, x);
	return x1;
}
function mm(a, b) {
	//Multiplies a*b where a and b are matrices.
	var x = [];
	for(var i=0; i<a.length; ++i) {
		x.push([]);
		for(var j=0; j<b[0].length; ++j) {
			var val = 0;
			for(var k=0; k<b.length; ++k) {
				val += a[i][k]*b[k][j];
			}
			x[i].push(val);
		}
	}
	return x;
}
function drawAxes() {
	var O = [[0], [0], [0], [1]];
	var xP = [[axisLength], [0], [0], [1]];
	var xN = [[-axisLength], [0], [0], [1]];
	var yP = [[0], [axisLength], [0], [1]];
	var yN = [[0], [-axisLength], [0], [1]];
	var zP = [[0], [0], [axisLength], [1]];
	var zN = [[0], [0], [-axisLength], [1]];

	var order = [xP, xN, yP, yN, zP, zN];
	for(var i=0; i<order.length; ++i) {
		context.beginPath();
		context.strokeStyle = axisColors[i];
		drawLine(O, order[i]);
		context.stroke();
	}
	context.strokeStyle = defaultLineColor;
}
function clearScreen() {
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, canvasDimensions[0], canvasDimensions[1]);
	metaTransformations();
}
function metaTransformations() {
	context.transform(1, 0, 0, 1, canvasDimensions[0]/2, canvasDimensions[1]/2); //Put the origin in the center of the canvas.
	context.transform(1, 0, 0, -1, 0, 0); //Flip it so y+ is up.
}
function translate(delta) {
	//delta is a 4x1 column vector representing the translation.
	//Not sure if it needs to be in terms of real or camera basis.
	var mat = [[1, 0, 0, delta[0]],
	           [0, 1, 0, delta[1]],
	           [0, 0, 1, delta[2]],
	           [0, 0, 0, delta[3]]]; //delta[3]=1
	currentTransform = mm(mat, currentTransform);
}
function rotate(axis, t) {
	//Rotate t radians about axis
	//CAUTION! axis should be a 3x1 (column) unit vector
	var ux = axis[0][0]; var ux2 = Math.pow(ux, 2);
	var uy = axis[1][0]; var uy2 = Math.pow(uy, 2);
	var uz = axis[2][0]; var uz2 = Math.pow(uz, 2);
	var c = Math.cos(t);
	var s = Math.sin(t);
	var mat = [[       c+(ux2*(1-c)), (ux*uy*(1-c))-(uz*s), (ux*uz*(1-c))+(uy*s), 0],
	           [(uy*ux*(1-c))+(uz*s),        c+(uy2*(1-c)), (uy*uz*(1-c))-(ux*s), 0],
	           [(uz*ux*(1-c))-(uy*s), (uz*uy*(1-c))+(ux*s),        c+(uz2*(1-c)), 0],
	           [                   0,                    0,                    0, 1]];
	currentTransform = mm(mat, currentTransform);
}
function keydown(event) {
	if(event.which == 81 && !keys[String(81)] && overCanvas) { //Q
		rotate([[0], [0], [1]], rotateRadiansPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
		reloadDisplay();
	}
	else if(event.which == 69 && !keys[String(69)] && overCanvas) { //E
		rotate([[0], [0], [1]], -1*rotateRadiansPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
		reloadDisplay();
	}
	else if(event.which == 87 && !keys[String(87)] && overCanvas) { //W
		translate([[0], [0], [translatePerTick], [1]]);
		window.setTimeout(forwardBackwardCheckAgain, translateCheckButtonSpeed);
		reloadDisplay();
	}
	else if(event.which == 83 && !keys[String(83)] && overCanvas) { //S
		translate([[0], [0], [-1*translatePerTick], [1]]);
		window.setTimeout(forwardBackwardCheckAgain, translateCheckButtonSpeed);
		reloadDisplay();
	}
	keys[String(event.which)] = true;
}
function keyup(event) {
	//
	keys[String(event.which)] = false;
}
function rotatingCheckAgain() {
	if(keys[String(81)] && overCanvas) {
		rotate([[0], [0], [1]], rotateRadiansPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
		reloadDisplay();
	}
	else if(keys[String(69)] && overCanvas) {
		rotate([[0], [0], [1]], -1*rotateRadiansPerTick);
		window.setTimeout(rotatingCheckAgain, rotateCheckButtonSpeed);
		reloadDisplay();
	}
}
function forwardBackwardCheckAgain() {
	if(keys[String(87)] && overCanvas) { //W
		translate([[0], [0], [translatePerTick], [1]]);
		window.setTimeout(forwardBackwardCheckAgain, translateCheckButtonSpeed);
		reloadDisplay();
	}
	else if(keys[String(83)] && overCanvas) { //S
		translate([[0], [0], [-1*translatePerTick], [1]]);
		window.setTimeout(forwardBackwardCheckAgain, translateCheckButtonSpeed);
		reloadDisplay();
	}
}
function mouseMoved(event) {
	mouseLocation[0] = event.clientX;
	mouseLocation[1] = event.clientY;

	if(oldMouseLocation.length == 0) {
		for(var i=0; i<mouseLocation.length; ++i) {
			oldMouseLocation[i] = mouseLocation[i];
		}
	}

	var delta = [mouseLocation[0]-oldMouseLocation[0], mouseLocation[1]-oldMouseLocation[1]];
	for(var i=0; i<delta.length; ++i) {
		delta[i]/zoom;
	}
	//console.log(delta);

	currentlyPanning = mouseButtons["1"] && overCanvas;
	currentlyTilting = keys["16"] && overCanvas;

	if(currentlyPanning) {
		translate([[delta[0]], [-1*delta[1]], [0], [1]]);
		reloadDisplay();
	}
	else if(currentlyTilting) {
		rotate([[0], [1], [0]], delta[0]*tiltRadiansPerPixel);
		rotate([[1], [0], [0]], delta[1]*tiltRadiansPerPixel);
		reloadDisplay();
	}

	for(var i=0; i<mouseLocation.length; ++i) {
		oldMouseLocation[i] = mouseLocation[i];
	}
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
	e.preventDefault();
	e.returnValue = false;
	console.log(e.deltaY);
	var val;
	if(e.deltaY > 0) {
		val = 1/((e.deltaY/mouseWheelCalibrationConstant)*zoomStep);
	}
	else if(e.deltaY < 0) {
		val = (-e.deltaY/mouseWheelCalibrationConstant)*zoomStep;
	}
	else {
		return;
	}
	zoom *= val;
	zoomTransformation(val)
	reloadDisplay();
}
function reloadDisplay() {
	clearScreen();
	drawAxes();
	drawPointCloud();
	updateTransformationDisplay();
}
function zoomTransformation(z) {
	var zoomMatrix = [
		[z, 0, 0, 0],
		[0, z, 0, 0],
		[0, 0, z, 0],
		[0, 0, 0, 1]
	];
	currentTransform = mm(zoomMatrix, currentTransform);
}
function updateTransformationDisplay() {
	for(var i=0; i<4; ++i) {
		for(var j=0; j<4; ++j) {
			html.currentTransform[i][j].innerHTML = currentTransform[i][j];
		}
	}
}
function newPC() {
	var tempSpace = [[]];
	var rawString = html.pcTextArea.value;
	var point = 0;
	while(rawString.length > 0) {
		var num = NaN;
		if(rawString[0] == "-") {
			if(isNaN(Number(rawString[1]))) {
				rawString = rawString.slice(0+2);
			}
			else if(!isNaN(Number(rawString[0]))) {
				var i=2;
				while(!isNaN(Number(rawString[i]))) {
					++i;
				}
				--i;
				num = Number(rawStrings.slice(0, i+1));
				rawString = rawString.slice(i+1);
			}
		}
		else if(rawString[0] == " ") {
			//Number(" ") evaluates to 0. WTF????
			rawString = rawString.slice(0+1);
		}
		else if(isNaN(Number(rawString[0]))) {
			rawString = rawString.slice(0+1);
		}
		else if(!isNaN(Number(rawString[0]))) {
			var i = 1;
			while(!isNaN(Number(rawString[i]))) {
				++i;
			}
			--i;
			num = Number(rawString.slice(0, i+1));
			rawString = rawString.slice(i+1);
		}
		if(!isNaN(num)) {
			if(tempSpace[point].length >= 3) {
				++point;
				tempSpace.push([]);
			}
			tempSpace[point].push(num);
		}
	}
	pointCloud = homogenizePointCloud(tempSpace);
	reloadDisplay();
}
function homogenizePointCloud(rawPC) {
	var cloud = [];
	for(var i=0; i<rawPC.length; ++i) {
		cloud.push([
			[rawPC[i][0]],
			[rawPC[i][1]],
			[rawPC[i][2]],
			[1]
		]);
	}
	return cloud;
}
function drawPointCloud() {
	var t0 = window.performance.now();
	var i;
	for(i=0; i<pointCloud.length; ++i) {
		drawPoint(pointCloud[i]);
	}
	var t1 = window.performance.now();
	var dt = t1-t0;
	html.frameTime.innerHTML = dt;
	html.pointsRendered.innerHTML = i;
	last5FrameTime.push(dt);

	if(last5FrameTime.length > 5) {
		last5FrameTime.splice(0, 1);
	}
	var sum = 0;
	for(var i=0; i<last5FrameTime.length; ++i) {
		sum += last5FrameTime[i];
	}
	html.frameTime5Avg.innerHTML = String(sum/last5FrameTime.length);
}
function cubeExample(increment) {
	//Just an example point cloud.
	pointCloud = [];
	for(var i=0; i<100; i+=increment) {
		for(var j=0; j<100; j+=increment) {
			for(var k=0; k<100; k+=increment) {
				pointCloud.push([[i], [j], [k], [1]]);
			}
		}
	}
	console.log("Drawing " + pointCloud.length + " points.");
	reloadDisplay();
}

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();