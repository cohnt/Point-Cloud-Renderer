///////////////////////////////////////////
/// CONSTANTS
///////////////////////////////////////////

var defaultTransformMatrix = [[1, 0, 0, 0], //The default transformation matrix.
                              [0, 1, 0, 0],
                              [0, 0, 1, 0],
                              [0, 0, 0, 1]];
var axisColors = ["#ff0000", "#00ff00", "#0000ff"]; //The colors of the x, y, and z axes (respectively).
var canvasDimensions = [null, null]; //Populated in setup()

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
	context.transform(1, 0, 0, 1, canvasDimensions[0]/2, canvasDimensions[1]/2); //Put the origin in the center of the canvas.
	context.transform(1, 0, 0, -1, 0, 0); //Flip it so y+ is up.

	loadDefaults();
}
function loadDefaults() {
	currentTransform = defaultTransformMatrix.slice();
}
function drawLine(a, b) {
	//a and b are 4x1 row vectors, representing homogeneous coordinates in real space
	var a1, b1;

}
function drawPoint(a) {
	//
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

///////////////////////////////////////////
/// EXECUTED CODE
///////////////////////////////////////////

setup();