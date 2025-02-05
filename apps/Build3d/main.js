/* constants */

const EMPTY = (1 << 15);
const EDGE_L2 = 4;
const EDGE_M1 = (1 << EDGE_L2) - 1;

/* get position number in map */

function getPos(x, y, z) {

  return (x << (2 * EDGE_L2)) | (y << EDGE_L2) | z;
}

/* get color number */

function getColor(s) {

  return (Number('0x' + s.substr(1, 2)) << 16) | (Number('0x' + s.substr(3, 2)) << 8) | Number('0x' + s.substr(5, 2));
}

/* get square of distance of a side of square from camera */

function dist(cam, pli) {

  var ma = 0;

  for(var i in pli.p) {

    ma = Math.max(ma, camera.getDist(pli.p[i]));
  }

  return ma;
}

/* check if point is inside a polygon */

function inside(point, poly) {

    var x = point.x, y = point.y;

    var vs = poly.p;

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

var camera = new Camera(90, 2); // Camera object

camera.rotate(-Math.PI * 0.25, -Math.PI * 0.25);

/* map for testing, this part of code will later be replaced */

var map = new Uint32Array(1 << (3 * EDGE_L2));

for(var i = 0; i < 32768; i++) map[i] = EMPTY;

for(var i = 0; i < (1 << EDGE_L2); i++) for(var j = 0; j < (1 << EDGE_L2); j++) map[getPos(i, 0, j)] = 255 << 8;

/* render */

var plains3D = [], projections = [];

/* check if place in the map is empty */

function isEmpty(x, y, z) {

  return x < 0 || y < 0 || z < 0 || x > EDGE_M1 || y > EDGE_M1 || z > EDGE_M1 || map[getPos(x, y, z)] == EMPTY;
}

/* left pad */

String.prototype.lpad = function(n, c) {

  s = '';

  for(var i = 0; i < Math.max(n - this.length, 0); i++) {

    s += '0';
  }

  return s + this;
}

/* function for loading a 3bm (bitmap format for 93D ) */

function loadMap(map) {

  plains3D = [];

  for(var x = 0; x < (1 << EDGE_L2); x++) {
    for(var y = 0; y < (1 << EDGE_L2); y++) {
      for(var z = 0; z < (1 << EDGE_L2); z++) {
        if(map[getPos(x, y, z)] != EMPTY) {

          var color = '#' + ((map[getPos(x, y, z)] >> 16) & 255).toString(16).lpad(2, '0') +
                            ((map[getPos(x, y, z)] >> 8) & 255).toString(16).lpad(2, '0') +
                            (map[getPos(x, y, z)] & 255).toString(16).lpad(2, '0');

          if(isEmpty(x + 1, y, z)) plains3D.push(new Plain(

            new Point3D(x + 1, y + 1, z + 1),
            new Point3D(x + 1, y + 1, z),
            new Point3D(x + 1, y, z),
            new Point3D(x + 1, y, z + 1),

            color, new Point3D(x, y, z), new Point3D(x + 1, y, z)
          ));
          if(isEmpty(x, y - 1, z)) plains3D.push(new Plain(

            new Point3D(x, y, z),
            new Point3D(x, y, z + 1),
            new Point3D(x + 1, y, z + 1),
            new Point3D(x + 1, y, z),

            color, new Point3D(x, y, z), new Point3D(x, y - 1, z)
          ));
          if(isEmpty(x, y, z + 1)) plains3D.push(new Plain(

            new Point3D(x, y + 1, z + 1),
            new Point3D(x + 1, y + 1, z + 1),
            new Point3D(x + 1, y, z + 1),
            new Point3D(x, y, z + 1),

            color, new Point3D(x, y, z), new Point3D(x, y, z + 1)
          ));
          if(isEmpty(x - 1, y, z)) plains3D.push(new Plain(

            new Point3D(x, y, z),
            new Point3D(x, y, z + 1),
            new Point3D(x, y + 1, z + 1),
            new Point3D(x, y + 1, z),

            color, new Point3D(x, y, z), new Point3D(x - 1, y, z)
          ));
          if(isEmpty(x, y + 1, z)) plains3D.push(new Plain(

            new Point3D(x, y + 1, z),
            new Point3D(x + 1, y + 1, z),
            new Point3D(x + 1, y + 1, z + 1),
            new Point3D(x, y + 1, z + 1),

            color, new Point3D(x, y, z), new Point3D(x, y + 1, z)
          ));
          if(isEmpty(x, y, z - 1)) plains3D.push(new Plain(

            new Point3D(x, y, z),
            new Point3D(x + 1, y, z),
            new Point3D(x + 1, y + 1, z),
            new Point3D(x, y + 1, z),

            color, new Point3D(x, y, z), new Point3D(x, y, z - 1)
          ));
        }
      }
    }
  }
}

ofc.lineWidth = '1';
ctx.font = '12px Monospace';

/* function for rendering screen */

function render() {

  projections = [];

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ofc.clearRect(0, 0, WIDTH, HEIGHT);

  plains3D.sort((a, b) => dist(camera, b) - dist(camera, a));

  for(var i = 0; i < plains3D.length; i++) {

    drawpoly(...plains3D[i].p.map(x => camera.project(x)), plains3D[i].color);

    projections.push(new Plain(...plains3D[i].p.map(x => camera.project(x)), dist(camera, plains3D[i]), plains3D[i].pos1, plains3D[i].pos2));
  }

  ctx.fillStyle = '#6699ff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.drawImage(ofscr, 0, 0);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText("[Use WASD keys to rotate]", 10, 20);
}

var conf = {
	TILE_COLOR : 255, // color of tiles to be placed
	MOUSE_SENSITIVITY: 15,
}

var key = {};
var mouse = {left: false, right: false, x: 0, y: 0, count: 0};

var update3DB = function() {

  /* rotation stuff */

  if(key[87]) camera.rotate(0, -Math.PI / 90);
  if(key[83]) camera.rotate(0, Math.PI / 90);
  if(key[68]) camera.rotate(-Math.PI / 90, 0);
  if(key[65]) camera.rotate(Math.PI / 90, 0);

  /* mouse stuff */

  if((mouse.left || mouse.right) && !mouse.count) {

    var pos1 = -1, pos2 = -1, di = 1e9; // pos1 = position of current block, pos2 = position of block this side is facing towards

    for(var i = 0; i < projections.length; i++) {

      if(inside(mouse, projections[i]) && projections[i].color < di) {

        di = projections[i].color; // color acts as distance here (don't ask why, there's no good answer)

        pos1 = projections[i].pos1;
        pos2 = projections[i].pos2;
      }
    }

    if(pos1 != -1) {

      if(mouse.left) map[getPos(pos2.x, pos2.y, pos2.z)] = conf.TILE_COLOR;
      if(mouse.right) map[getPos(pos1.x, pos1.y, pos1.z)] = EMPTY;

      mouse.count = conf.MOUSE_SENSITIVITY;

      loadMap(map);
    }
  }

  if(mouse.count) mouse.count--;

  render();
}

var cbr;

/* event listeners */
document.addEventListener('keydown', e => key[e.keyCode] = true);
document.addEventListener('keyup',  e => key[e.keyCode] = false);
document.addEventListener('mouseup', e => {
  if(!e.button) mouse.left = false;
  else mouse.right = false;
  return false;
});
document.addEventListener('mousedown', e => {
  if(mouse.x < cbr.left || mouse.x > cbr.right || mouse.y < cbr.top || mouse.y > cbr.bottom) return;
  if(!e.button) mouse.left = true;
  else mouse.right = true;
});
document.addEventListener('mousemove', e => {

  cbr = canvas.getBoundingClientRect(); // for mouse location
  mouse.x = e.pageX - cbr.left - 4;
  mouse.y = e.pageY - cbr.top - 4;
});
canvas.oncontextmenu = e => false; // cause right click is used for destroying blocks


/*

EXPORTS:

- update3DB(), use it in setInterval
- camera.setFov(angle)
- camera.dist = distance from model
- camera.top = y-position of the lowest layer of map
- loadMap(Uint32Array) = load a map into the editor
- conf.TILE_COLOR - a number representing current fill color
- getColor(html color code) - returns a number presenting given color

IMPORTANT:

- when program loads, it finds a canvas element with id = "voxelscreen",
  make sure to have that element somewhere before running program

*/
