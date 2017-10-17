///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var canvasWidth = 750;
var canvasHeight = 750;
var mouseWheelCalibrationConstant = 53; //This is the value given when the mouse is scrolled one notch.
var axisColors = ["#ff0000", "#00cc00", "#0000ff"]; //The colors of the axes shown about global zero.
var dragRotatingConstant = 1/180; //This constant represents degrees rotated per pixel dragged.
var dragPanningConstant = 1; //This constant slows down the rate that dragging pans the graph.
var rotateCheckButtonSpeed = 25; //How often the program checks if the rotate button is still pressed, in milliseconds.
var rotateDegreesPerTick = 1.5; //How many degrees the view rotates per tick.
var defaultViewBasis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
var defaultCameraLocation = [0, 0, 1];
var axisDrawDistance = 50; //In meters, this is gonna be changed later.


///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var html = {};
var pointCloud = [];
var viewBasis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
var cameraLocation = [0, 0, 1];
var keys = {};
var mouseButtons = {};
var overCanvas = false;
var mouseLocation = [];
var oldMouseLocation = [];
var context;

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

	viewBasis = defaultViewBasis.slice(0);
	cameraLocation = defaultCameraLocation.slice(0);

	context = html.canvas.getContext("2d");
	context.transform(1, 0, 0, 1, html.canvas.width/2, html.canvas.height/2);
	context.transform(1, 0, 0, -1, 0, 0);
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
function keyup(e) {
	//
	keys[String(event.which)] = false;
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
}
function mouseMoved(e) {
	mouseLocation[0] = -event.clientX; //We're dragging the graph, not the camera.
	mouseLocation[1] = event.clientY;
	mouseLocation[2] = 0;

	if(oldMouseLocation.length == 0) {
		for(var i=0; i<mouseLocation.length; ++i) {
			oldMouseLocation[i] = mouseLocation[i];
		}
	}

	var delta = ma(mouseLocation, makeRowVector(mNeg(oldMouseLocation)));
	var basisDelta = makeRowVector(mm(mInv3x3(viewBasis), delta));
	//console.log(basisDelta);

	currentlyPanning = mouseButtons["1"] && overCanvas;
	currentlyTilting = keys["16"] && overCanvas;

	if(currentlyPanning) {
		pannedGraph(basisDelta);
	}
	else if(currentlyTilting) {
		tiltedGraph(delta);
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
	var relativeDistanceVector = [0, 0, -e.deltaY/mouseWheelCalibrationConstant];
	var basisDistanceVector = mm(mInv3x3(viewBasis), relativeDistanceVector);
	cameraLocation = ma(cameraLocation, makeRowVector(basisDistanceVector));
	cameraLocation = makeRowVector(cameraLocation);
	console.log(cameraLocation);
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
	console.log("Location: " + cameraLocation);
	console.log("Basis: " + viewBasis[0] + " " + viewBasis[1] + " " + viewBasis[2]);
}
function pannedGraph(d) {
	cameraLocation = makeRowVector(ma(cameraLocation, makeRowVector(mScal(dragPanningConstant, d))));
	console.log("Location: " + cameraLocation);
	console.log("Basis: " + viewBasis[0] + " " + viewBasis[1] + " " + viewBasis[2]);
}
function tiltedGraph(d) {
	//This is a series of two rotations.
	//First, rotate dx about the y-axis.
	//Then, rotate dy about the x-axis.
	var rotationAxis;
	var t;
	var ux, uy, uz;
	var rotationMatrix1, rotationMatrix2;

	//Rotation 1:
	rotationAxis = viewBasis[1].slice(0); //About the y-axis.
	t = d[0]*dragRotatingConstant;
	ux = rotationAxis[0], uy = rotationAxis[1], uz = rotationAxis[2];
	rotationMatrix1 = [
		[ cos(t)+(sq(ux)*(1-cos(t))), (ux*uy*(1-cos(t)))-(uz*sin(t)), (ux*uz*(1-cos(t)))+(uy*sin(t)) ],
		[ (uy*ux*(1-cos(t)))+(uz*sin(t)), cos(t)+(sq(uy)*(1-cos(t))), (uy*uz*(1-cos(t)))-(ux*sin(t)) ],
		[ (uz*ux*(1-cos(t)))-(uy*sin(t)), (uz*uy*(1-cos(t)))+(ux*sin(t)), cos(t)+(sq(uz)*(1-cos(t))) ]
	];

	//Rotation 2:
	rotationAxis = viewBasis[0].slice(0); //About the x-axis.
	t = d[1]*dragRotatingConstant;
	ux = rotationAxis[0], uy = rotationAxis[1], uz = rotationAxis[2];
	rotationMatrix1 = [
		[ cos(t)+(sq(ux)*(1-cos(t))), (ux*uy*(1-cos(t)))-(uz*sin(t)), (ux*uz*(1-cos(t)))+(uy*sin(t)) ],
		[ (uy*ux*(1-cos(t)))+(uz*sin(t)), cos(t)+(sq(uy)*(1-cos(t))), (uy*uz*(1-cos(t)))-(ux*sin(t)) ],
		[ (uz*ux*(1-cos(t)))-(uy*sin(t)), (uz*uy*(1-cos(t)))+(ux*sin(t)), cos(t)+(sq(uz)*(1-cos(t))) ]
	];

	viewBasis = mm(rotationMatrix1, viewBasis);
	viewBasis = mm(rotationMatrix2, viewBasis);

	console.log("Location: " + cameraLocation);
	console.log("Basis: " + viewBasis[0] + " " + viewBasis[1] + " " + viewBasis[2]);
}
function mm(a, b) {
	//Return c=a*b where a and b are matrices. If their dimensions mismatch, return false;
	if(a[0].length != b.length) {
		return false;
	}
	if(b[0].length == undefined) {
		b = makeColVector(b);
	}
	if(a[0].length == undefined) {
		a = makeColVector(a);
	}
	var c = [];
	for(var i=0; i<a.length; ++i) {
		c.push([]);
		for(var j=0; j<b[0].length; ++j) {
			c[i][j] = 0;
			for(var k=0; k<a[i].length; ++k) {
				c[i][j] += a[i][k]*b[k][j];
			}
		}
	}
	return c;
}
function ma(a, b) {
	//Return c=a+b where a and b are matrices. If their dimensions mismatch, return false;
	if(!((a.length == b.length) && (a[0].length == b[0].length))) {
		return false;
	}
	if(a[0].length == undefined) {
		a = makeColVector(a);
	}
	if(b[0].length == undefined) {
		b = makeColVector(b);
	}
	var c = [];
	for(var i=0; i<a.length; ++i) {
		c.push([]);
		for(var j=0; j<a[i].length; ++j) {
			c[i][j] = a[i][j]+b[i][j];
		}
	}
	return c;
}
function mNeg(x) {
	//Returns the negative of x.
	return mScal(-1, x);
}
function mScal(s, x) {
	//Returns s*x
	var mX = [];
	if(x[0].length == undefined) {
		x = makeColVector(x);
	}
	for(var i=0; i<x.length; ++i) {
		mX.push([]);
		for(var j=0; j<x[i].length; ++j) {
			mX[i][j] = s*x[i][j];
		}
	}
	return mX;
}
function mInv3x3(x) {
	//Thanks again wikipedia! https://en.wikipedia.org/wiki/Invertible_matrix#Methods_of_matrix_inversion
	//NOTE: This is only for 3x3 matrices.
	//inv will be returned.
	var inv = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
	var a=x[0][0]; var b=x[0][1]; var c=x[0][2];
	var d=x[1][0]; var e=x[1][1]; var f=x[1][2];
	var g=x[2][0]; var h=x[2][1]; var i=x[2][2];

	var A=(e*i-f*h); var D=(c*h-b*i); var G=(b*f-c*e);
	var B=(f*g-d*i); var E=(a*i-c*g); var H=(c*d-a*f);
	var C=(d*h-e*g); var F=(b*g-a*h); var I=(a*e-b*d);

	var det = (a*e*i)+(b*f*g)+(c*d*h)-(c*e*g)-(b*d*i)-(a*f*h);

	inv[0][0] = A; inv[0][1] = D; inv[0][2] = G;
	inv[1][0] = B; inv[1][1] = E; inv[1][2] = H;
	inv[2][0] = C; inv[2][1] = F; inv[2][2] = I;

	for(var i=0; i<3; ++i) {
		for(var j=0; j<3; ++j) {
			inv[i][j] = inv[i][j]/det;
		}
	}
	return inv;
}
function sin(x) { return Math.sin(x); }
function cos(x) { return Math.cos(x); }
function sq(x) { return x*x; }
function sqrt(x) { return Math.sqrt(x); }
function makeRowVector(x) {
	var y = [];
	for(var i=0; i<x.length; ++i) {
		y.push(x[i][0]);
	}
	return y;
}
function makeColVector(y) {
	var x = [];
	for(var i=0; i<y.length; ++i) {
		x.push([y[i]]);
	}
	return x;
}
function compUV(u, v) {
	//The component projection of v onto u
	//https://en.wikipedia.org/wiki/Scalar_projection
	return dot(u, v)/Math.sqrt(dot(u, u));
}
function dot(a, b) {
	var total = 0;
	for(var i=0; i<a.length; ++i) {
		total += a[i]*b[i];
	}
	return total;
}
function drawAxes() {
	//x-axis
	var x0 = projectPoint([0, 0, 0]);
	var x1 = projectPoint([axisDrawDistance, 0, 0]);
	context.beginPath();
	context.strokeStyle = axisColors[0];
	context.moveTo(x0[0], x0[1]);
	context.lineTo(x1[0], x1[1]);
	context.stroke();

	//y-axis
	var y0 = projectPoint([0, 0, 0]);
	var y1 = projectPoint([0, axisDrawDistance, 0]);
	context.beginPath();
	context.strokeStyle = axisColors[1];
	context.moveTo(y0[0], y0[1]);
	context.lineTo(y1[0], y1[1]);
	context.stroke();

	//z-axis
	var z0 = projectPoint([0, 0, 0]);
	var z1 = projectPoint([0, 0, axisDrawDistance]);
	context.beginPath();
	context.strokeStyle = axisColors[2];
	context.moveTo(z0[0], z0[1]);
	context.lineTo(z1[0], z1[1]);
	context.stroke();
}
function projectPoint(p) {
	var relativePoint = makeRowVector(ma(p, makeRowVector(mNeg(cameraLocation))));
	return [compUV(viewBasis[0], relativePoint), compUV(viewBasis[1], relativePoint), 0];
}
function clearAndResetCanvas() {
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, html.canvas.width, html.canvas.height);
	context.transform(1, 0, 0, 1, html.canvas.width/2, html.canvas.height/2);
	context.transform(1, 0, 0, -1, 0, 0);
}

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();