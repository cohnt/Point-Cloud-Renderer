///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var defaultTransformMatrix = [[1, 0, 0, 0], //The default transformation matrix.
                              [0, 1, 0, 0],
                              [0, 0, 1, -10],
                              [0, 0, 0, 1]];
var axisColors = ["#ff0000", "#ffaaaa", "#00ff00", "#aaffaa", "#0000ff", "#aaaaff"]; //The colors of the x+, x-, y+, y-, z+, and z- axes (respectively).
var canvasDimensions = [null, null]; //Populated in setup()
var axisLength = 100; //In pixels.
var defaultLineColor = "#000000";

///////////////////////////////////////////
/// GLOBAL VARIABLES
///////////////////////////////////////////

var html = {}; //An object containing every html element on the page.
var context; //The to-be-created 2D canvas context.
var currentTransform; //The current matrix transformation to map a point in the 3D real space to the camera perspective.

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

	//The raw output of getAttribute is "####px", so we need to shave off the px and parse to a number.
	canvasDimensions[0] = Number(html.canvas.getAttribute("width").slice(0,-2));
	canvasDimensions[1] = Number(html.canvas.getAttribute("height").slice(0,-2));

	context = html.canvas.getContext("2d"); //Create a 2D context.
	metaTransformations();

	loadDefaults();
	drawAxes();
}
function loadDefaults() {
	//
	currentTransform = defaultTransformMatrix.slice();
}
function drawPoint(a) {
	//a is a 4x1 column vector, representing a homogeneous coordinate in the real basis.
	var a1 = projectToScreen(a);
	if(a1[2] < 0) { //If the point is in front of the camera
		            //Recall that with the right-hand-rule, the positive z-axis is pointing towards you.
		context.fillRect(a1[0], a1[1], 1, 1); //Draw a "pixel" by drawing a 1x1 rectangle.
		                                      //For some reason, this is the fastest way to do it with canvas.
	}
	else {
		console.log(a1[0] + " " + a1[1] + " " + a1[2] + " " + a1[3]); //Print out the coordinate if it isn't drawn.
	}
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

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();