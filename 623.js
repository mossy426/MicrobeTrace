"use strict";
(self["webpackChunkMicrobeTrace"] = self["webpackChunkMicrobeTrace"] || []).push([[623],{

/***/ 82747:
/*!*********************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/center.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(x, y) {
  var nodes,
    strength = 1;
  if (x == null) x = 0;
  if (y == null) y = 0;
  function force() {
    var i,
      n = nodes.length,
      node,
      sx = 0,
      sy = 0;
    for (i = 0; i < n; ++i) {
      node = nodes[i], sx += node.x, sy += node.y;
    }
    for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, i = 0; i < n; ++i) {
      node = nodes[i], node.x -= sx, node.y -= sy;
    }
  }
  force.initialize = function (_) {
    nodes = _;
  };
  force.x = function (_) {
    return arguments.length ? (x = +_, force) : x;
  };
  force.y = function (_) {
    return arguments.length ? (y = +_, force) : y;
  };
  force.strength = function (_) {
    return arguments.length ? (strength = +_, force) : strength;
  };
  return force;
}

/***/ }),

/***/ 52107:
/*!**********************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/collide.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var d3_quadtree__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3-quadtree */ 42707);
/* harmony import */ var _constant_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constant.js */ 98342);
/* harmony import */ var _jiggle_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./jiggle.js */ 99167);



function x(d) {
  return d.x + d.vx;
}
function y(d) {
  return d.y + d.vy;
}
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(radius) {
  var nodes,
    radii,
    random,
    strength = 1,
    iterations = 1;
  if (typeof radius !== "function") radius = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(radius == null ? 1 : +radius);
  function force() {
    var i,
      n = nodes.length,
      tree,
      node,
      xi,
      yi,
      ri,
      ri2;
    for (var k = 0; k < iterations; ++k) {
      tree = (0,d3_quadtree__WEBPACK_IMPORTED_MODULE_1__["default"])(nodes, x, y).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }
    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data,
        rj = quad.r,
        r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x = xi - data.x - data.vx,
            y = yi - data.y - data.vy,
            l = x * x + y * y;
          if (l < r * r) {
            if (x === 0) x = (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_2__["default"])(random), l += x * x;
            if (y === 0) y = (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_2__["default"])(random), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }
  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }
  function initialize() {
    if (!nodes) return;
    var i,
      n = nodes.length,
      node;
    radii = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }
  force.initialize = function (_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.iterations = function (_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };
  force.strength = function (_) {
    return arguments.length ? (strength = +_, force) : strength;
  };
  force.radius = function (_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : radius;
  };
  return force;
}

/***/ }),

/***/ 98342:
/*!***********************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/constant.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(x) {
  return function () {
    return x;
  };
}

/***/ }),

/***/ 21623:
/*!********************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/index.js ***!
  \********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "forceCenter": () => (/* reexport safe */ _center_js__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "forceCollide": () => (/* reexport safe */ _collide_js__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "forceLink": () => (/* reexport safe */ _link_js__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "forceManyBody": () => (/* reexport safe */ _manyBody_js__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "forceRadial": () => (/* reexport safe */ _radial_js__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   "forceSimulation": () => (/* reexport safe */ _simulation_js__WEBPACK_IMPORTED_MODULE_5__["default"]),
/* harmony export */   "forceX": () => (/* reexport safe */ _x_js__WEBPACK_IMPORTED_MODULE_6__["default"]),
/* harmony export */   "forceY": () => (/* reexport safe */ _y_js__WEBPACK_IMPORTED_MODULE_7__["default"])
/* harmony export */ });
/* harmony import */ var _center_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./center.js */ 82747);
/* harmony import */ var _collide_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./collide.js */ 52107);
/* harmony import */ var _link_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./link.js */ 52900);
/* harmony import */ var _manyBody_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./manyBody.js */ 77650);
/* harmony import */ var _radial_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./radial.js */ 22948);
/* harmony import */ var _simulation_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./simulation.js */ 51146);
/* harmony import */ var _x_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./x.js */ 98463);
/* harmony import */ var _y_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./y.js */ 65076);









/***/ }),

/***/ 99167:
/*!*********************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/jiggle.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(random) {
  return (random() - 0.5) * 1e-6;
}

/***/ }),

/***/ 64912:
/*!******************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/lcg.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
const a = 1664525;
const c = 1013904223;
const m = 4294967296; // 2^32

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  let s = 1;
  return () => (s = (a * s + c) % m) / m;
}

/***/ }),

/***/ 52900:
/*!*******************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/link.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _constant_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constant.js */ 98342);
/* harmony import */ var _jiggle_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./jiggle.js */ 99167);


function index(d) {
  return d.index;
}
function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("node not found: " + nodeId);
  return node;
}
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(links) {
  var id = index,
    strength = defaultStrength,
    strengths,
    distance = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(30),
    distances,
    nodes,
    count,
    bias,
    random,
    iterations = 1;
  if (links == null) links = [];
  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }
  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x = target.x + target.vx - source.x - source.vx || (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_1__["default"])(random);
        y = target.y + target.vy - source.y - source.vy || (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_1__["default"])(random);
        l = Math.sqrt(x * x + y * y);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l;
        target.vx -= x * (b = bias[i]);
        target.vy -= y * b;
        source.vx += x * (b = 1 - b);
        source.vy += y * b;
      }
    }
  }
  function initialize() {
    if (!nodes) return;
    var i,
      n = nodes.length,
      m = links.length,
      nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
      link;
    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }
    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }
    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }
  function initializeStrength() {
    if (!nodes) return;
    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }
  function initializeDistance() {
    if (!nodes) return;
    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }
  force.initialize = function (_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.links = function (_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };
  force.id = function (_) {
    return arguments.length ? (id = _, force) : id;
  };
  force.iterations = function (_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };
  force.strength = function (_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initializeStrength(), force) : strength;
  };
  force.distance = function (_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initializeDistance(), force) : distance;
  };
  return force;
}

/***/ }),

/***/ 77650:
/*!***********************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/manyBody.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var d3_quadtree__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3-quadtree */ 42707);
/* harmony import */ var _constant_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constant.js */ 98342);
/* harmony import */ var _jiggle_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./jiggle.js */ 99167);
/* harmony import */ var _simulation_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./simulation.js */ 51146);




/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var nodes,
    node,
    random,
    alpha,
    strength = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(-30),
    strengths,
    distanceMin2 = 1,
    distanceMax2 = Infinity,
    theta2 = 0.81;
  function force(_) {
    var i,
      n = nodes.length,
      tree = (0,d3_quadtree__WEBPACK_IMPORTED_MODULE_1__["default"])(nodes, _simulation_js__WEBPACK_IMPORTED_MODULE_2__.x, _simulation_js__WEBPACK_IMPORTED_MODULE_2__.y).visitAfter(accumulate);
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
  }
  function initialize() {
    if (!nodes) return;
    var i,
      n = nodes.length,
      node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
  }
  function accumulate(quad) {
    var strength = 0,
      q,
      c,
      weight = 0,
      x,
      y,
      i;

    // For internal nodes, accumulate forces from child quadrants.
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = Math.abs(q.value))) {
          strength += q.value, weight += c, x += c * q.x, y += c * q.y;
        }
      }
      quad.x = x / weight;
      quad.y = y / weight;
    }

    // For leaf nodes, accumulate forces from coincident quadrants.
    else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do strength += strengths[q.data.index]; while (q = q.next);
    }
    quad.value = strength;
  }
  function apply(quad, x1, _, x2) {
    if (!quad.value) return true;
    var x = quad.x - node.x,
      y = quad.y - node.y,
      w = x2 - x1,
      l = x * x + y * y;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0) x = (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_3__["default"])(random), l += x * x;
        if (y === 0) y = (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_3__["default"])(random), l += y * y;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += x * quad.value * alpha / l;
        node.vy += y * quad.value * alpha / l;
      }
      return true;
    }

    // Otherwise, process points directly.
    else if (quad.length || l >= distanceMax2) return;

    // Limit forces for very close nodes; randomize direction if coincident.
    if (quad.data !== node || quad.next) {
      if (x === 0) x = (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_3__["default"])(random), l += x * x;
      if (y === 0) y = (0,_jiggle_js__WEBPACK_IMPORTED_MODULE_3__["default"])(random), l += y * y;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }
    do if (quad.data !== node) {
      w = strengths[quad.data.index] * alpha / l;
      node.vx += x * w;
      node.vy += y * w;
    } while (quad = quad.next);
  }
  force.initialize = function (_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };
  force.strength = function (_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : strength;
  };
  force.distanceMin = function (_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };
  force.distanceMax = function (_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };
  force.theta = function (_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };
  return force;
}

/***/ }),

/***/ 22948:
/*!*********************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/radial.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _constant_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constant.js */ 98342);

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(radius, x, y) {
  var nodes,
    strength = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(0.1),
    strengths,
    radiuses;
  if (typeof radius !== "function") radius = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+radius);
  if (x == null) x = 0;
  if (y == null) y = 0;
  function force(alpha) {
    for (var i = 0, n = nodes.length; i < n; ++i) {
      var node = nodes[i],
        dx = node.x - x || 1e-6,
        dy = node.y - y || 1e-6,
        r = Math.sqrt(dx * dx + dy * dy),
        k = (radiuses[i] - r) * strengths[i] * alpha / r;
      node.vx += dx * k;
      node.vy += dy * k;
    }
  }
  function initialize() {
    if (!nodes) return;
    var i,
      n = nodes.length;
    strengths = new Array(n);
    radiuses = new Array(n);
    for (i = 0; i < n; ++i) {
      radiuses[i] = +radius(nodes[i], i, nodes);
      strengths[i] = isNaN(radiuses[i]) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function (_) {
    nodes = _, initialize();
  };
  force.strength = function (_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : strength;
  };
  force.radius = function (_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : radius;
  };
  force.x = function (_) {
    return arguments.length ? (x = +_, force) : x;
  };
  force.y = function (_) {
    return arguments.length ? (y = +_, force) : y;
  };
  return force;
}

/***/ }),

/***/ 51146:
/*!*************************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/simulation.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "x": () => (/* binding */ x),
/* harmony export */   "y": () => (/* binding */ y)
/* harmony export */ });
/* harmony import */ var d3_dispatch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3-dispatch */ 60903);
/* harmony import */ var d3_timer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3-timer */ 20392);
/* harmony import */ var _lcg_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lcg.js */ 64912);



function x(d) {
  return d.x;
}
function y(d) {
  return d.y;
}
var initialRadius = 10,
  initialAngle = Math.PI * (3 - Math.sqrt(5));
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(nodes) {
  var simulation,
    alpha = 1,
    alphaMin = 0.001,
    alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
    alphaTarget = 0,
    velocityDecay = 0.6,
    forces = new Map(),
    stepper = (0,d3_timer__WEBPACK_IMPORTED_MODULE_0__.timer)(step),
    event = (0,d3_dispatch__WEBPACK_IMPORTED_MODULE_1__["default"])("tick", "end"),
    random = (0,_lcg_js__WEBPACK_IMPORTED_MODULE_2__["default"])();
  if (nodes == null) nodes = [];
  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }
  function tick(iterations) {
    var i,
      n = nodes.length,
      node;
    if (iterations === undefined) iterations = 1;
    for (var k = 0; k < iterations; ++k) {
      alpha += (alphaTarget - alpha) * alphaDecay;
      forces.forEach(function (force) {
        force(alpha);
      });
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        if (node.fx == null) node.x += node.vx *= velocityDecay;else node.x = node.fx, node.vx = 0;
        if (node.fy == null) node.y += node.vy *= velocityDecay;else node.y = node.fy, node.vy = 0;
      }
    }
    return simulation;
  }
  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (node.fx != null) node.x = node.fx;
      if (node.fy != null) node.y = node.fy;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(0.5 + i),
          angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }
  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes, random);
    return force;
  }
  initializeNodes();
  return simulation = {
    tick: tick,
    restart: function () {
      return stepper.restart(step), simulation;
    },
    stop: function () {
      return stepper.stop(), simulation;
    },
    nodes: function (_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
    },
    alpha: function (_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },
    alphaMin: function (_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },
    alphaDecay: function (_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },
    alphaTarget: function (_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },
    velocityDecay: function (_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },
    randomSource: function (_) {
      return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
    },
    force: function (name, _) {
      return arguments.length > 1 ? (_ == null ? forces.delete(name) : forces.set(name, initializeForce(_)), simulation) : forces.get(name);
    },
    find: function (x, y, radius) {
      var i = 0,
        n = nodes.length,
        dx,
        dy,
        d2,
        node,
        closest;
      if (radius == null) radius = Infinity;else radius *= radius;
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;
      }
      return closest;
    },
    on: function (name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}

/***/ }),

/***/ 98463:
/*!****************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/x.js ***!
  \****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _constant_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constant.js */ 98342);

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(x) {
  var strength = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(0.1),
    nodes,
    strengths,
    xz;
  if (typeof x !== "function") x = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(x == null ? 0 : +x);
  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }
  function initialize() {
    if (!nodes) return;
    var i,
      n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function (_) {
    nodes = _;
    initialize();
  };
  force.strength = function (_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : strength;
  };
  force.x = function (_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : x;
  };
  return force;
}

/***/ }),

/***/ 65076:
/*!****************************************************************!*\
  !*** ./node_modules/@unovis/ts/node_modules/d3-force/src/y.js ***!
  \****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _constant_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constant.js */ 98342);

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(y) {
  var strength = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(0.1),
    nodes,
    strengths,
    yz;
  if (typeof y !== "function") y = (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(y == null ? 0 : +y);
  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
    }
  }
  function initialize() {
    if (!nodes) return;
    var i,
      n = nodes.length;
    strengths = new Array(n);
    yz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }
  force.initialize = function (_) {
    nodes = _;
    initialize();
  };
  force.strength = function (_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : strength;
  };
  force.y = function (_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : (0,_constant_js__WEBPACK_IMPORTED_MODULE_0__["default"])(+_), initialize(), force) : y;
  };
  return force;
}

/***/ }),

/***/ 9335:
/*!*********************************************!*\
  !*** ./node_modules/d3-quadtree/src/add.js ***!
  \*********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addAll": () => (/* binding */ addAll),
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(d) {
  const x = +this._x.call(null, d),
    y = +this._y.call(null, d);
  return add(this.cover(x, y), x, y, d);
}
function add(tree, x, y, d) {
  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

  var parent,
    node = tree._root,
    leaf = {
      data: d
    },
    x0 = tree._x0,
    y0 = tree._y0,
    x1 = tree._x1,
    y1 = tree._y1,
    xm,
    ym,
    xp,
    yp,
    right,
    bottom,
    i,
    j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return tree._root = leaf, tree;

  // Find the existing leaf for the new point, or add it.
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }

  // Is the new point is exactly coincident with the existing point?
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

  // Otherwise, split the leaf node until the old and new point are separated.
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
  return parent[j] = node, parent[i] = leaf, tree;
}
function addAll(data) {
  var d,
    i,
    n = data.length,
    x,
    y,
    xz = new Array(n),
    yz = new Array(n),
    x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;

  // Compute the points and their extent.
  for (i = 0; i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // If there were no (valid) points, abort.
  if (x0 > x1 || y0 > y1) return this;

  // Expand the tree to cover the new points.
  this.cover(x0, y0).cover(x1, y1);

  // Add the new points.
  for (i = 0; i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }
  return this;
}

/***/ }),

/***/ 32209:
/*!***********************************************!*\
  !*** ./node_modules/d3-quadtree/src/cover.js ***!
  \***********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

  var x0 = this._x0,
    y0 = this._y0,
    x1 = this._x1,
    y1 = this._y1;

  // If the quadtree has no extent, initialize them.
  // Integer extent are necessary so that if we later double the extent,
  // the existing quadrant boundaries don’t change due to floating point error!
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  }

  // Otherwise, double repeatedly to cover.
  else {
    var z = x1 - x0 || 1,
      node = this._root,
      parent,
      i;
    while (x0 > x || x >= x1 || y0 > y || y >= y1) {
      i = (y < y0) << 1 | x < x0;
      parent = new Array(4), parent[i] = node, node = parent, z *= 2;
      switch (i) {
        case 0:
          x1 = x0 + z, y1 = y0 + z;
          break;
        case 1:
          x0 = x1 - z, y1 = y0 + z;
          break;
        case 2:
          x1 = x0 + z, y0 = y1 - z;
          break;
        case 3:
          x0 = x1 - z, y0 = y1 - z;
          break;
      }
    }
    if (this._root && this._root.length) this._root = node;
  }
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}

/***/ }),

/***/ 32615:
/*!**********************************************!*\
  !*** ./node_modules/d3-quadtree/src/data.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var data = [];
  this.visit(function (node) {
    if (!node.length) do data.push(node.data); while (node = node.next);
  });
  return data;
}

/***/ }),

/***/ 37577:
/*!************************************************!*\
  !*** ./node_modules/d3-quadtree/src/extent.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(_) {
  return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
}

/***/ }),

/***/ 55582:
/*!**********************************************!*\
  !*** ./node_modules/d3-quadtree/src/find.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _quad_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./quad.js */ 84591);

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(x, y, radius) {
  var data,
    x0 = this._x0,
    y0 = this._y0,
    x1,
    y1,
    x2,
    y2,
    x3 = this._x1,
    y3 = this._y1,
    quads = [],
    node = this._root,
    q,
    i;
  if (node) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }
  while (q = quads.pop()) {
    // Stop searching if this quadrant can’t contain a closer node.
    if (!(node = q.node) || (x1 = q.x0) > x3 || (y1 = q.y0) > y3 || (x2 = q.x1) < x0 || (y2 = q.y1) < y0) continue;

    // Bisect the current quadrant.
    if (node.length) {
      var xm = (x1 + x2) / 2,
        ym = (y1 + y2) / 2;
      quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](node[3], xm, ym, x2, y2), new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](node[2], x1, ym, xm, y2), new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](node[1], xm, y1, x2, ym), new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](node[0], x1, y1, xm, ym));

      // Visit the closest quadrant first.
      if (i = (y >= ym) << 1 | x >= xm) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    }

    // Visit this point. (Visiting coincident points isn’t necessary!)
    else {
      var dx = x - +this._x.call(null, node.data),
        dy = y - +this._y.call(null, node.data),
        d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }
  return data;
}

/***/ }),

/***/ 84591:
/*!**********************************************!*\
  !*** ./node_modules/d3-quadtree/src/quad.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}

/***/ }),

/***/ 42707:
/*!**************************************************!*\
  !*** ./node_modules/d3-quadtree/src/quadtree.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ quadtree)
/* harmony export */ });
/* harmony import */ var _add_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./add.js */ 9335);
/* harmony import */ var _cover_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./cover.js */ 32209);
/* harmony import */ var _data_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./data.js */ 32615);
/* harmony import */ var _extent_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./extent.js */ 37577);
/* harmony import */ var _find_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./find.js */ 55582);
/* harmony import */ var _remove_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./remove.js */ 38632);
/* harmony import */ var _root_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./root.js */ 41850);
/* harmony import */ var _size_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./size.js */ 53153);
/* harmony import */ var _visit_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./visit.js */ 61524);
/* harmony import */ var _visitAfter_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./visitAfter.js */ 18741);
/* harmony import */ var _x_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./x.js */ 44831);
/* harmony import */ var _y_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./y.js */ 98032);












function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? _x_js__WEBPACK_IMPORTED_MODULE_0__.defaultX : x, y == null ? _y_js__WEBPACK_IMPORTED_MODULE_1__.defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}
function leaf_copy(leaf) {
  var copy = {
      data: leaf.data
    },
    next = copy;
  while (leaf = leaf.next) next = next.next = {
    data: leaf.data
  };
  return copy;
}
var treeProto = quadtree.prototype = Quadtree.prototype;
treeProto.copy = function () {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
    node = this._root,
    nodes,
    child;
  if (!node) return copy;
  if (!node.length) return copy._root = leaf_copy(node), copy;
  nodes = [{
    source: node,
    target: copy._root = new Array(4)
  }];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({
          source: child,
          target: node.target[i] = new Array(4)
        });else node.target[i] = leaf_copy(child);
      }
    }
  }
  return copy;
};
treeProto.add = _add_js__WEBPACK_IMPORTED_MODULE_2__["default"];
treeProto.addAll = _add_js__WEBPACK_IMPORTED_MODULE_2__.addAll;
treeProto.cover = _cover_js__WEBPACK_IMPORTED_MODULE_3__["default"];
treeProto.data = _data_js__WEBPACK_IMPORTED_MODULE_4__["default"];
treeProto.extent = _extent_js__WEBPACK_IMPORTED_MODULE_5__["default"];
treeProto.find = _find_js__WEBPACK_IMPORTED_MODULE_6__["default"];
treeProto.remove = _remove_js__WEBPACK_IMPORTED_MODULE_7__["default"];
treeProto.removeAll = _remove_js__WEBPACK_IMPORTED_MODULE_7__.removeAll;
treeProto.root = _root_js__WEBPACK_IMPORTED_MODULE_8__["default"];
treeProto.size = _size_js__WEBPACK_IMPORTED_MODULE_9__["default"];
treeProto.visit = _visit_js__WEBPACK_IMPORTED_MODULE_10__["default"];
treeProto.visitAfter = _visitAfter_js__WEBPACK_IMPORTED_MODULE_11__["default"];
treeProto.x = _x_js__WEBPACK_IMPORTED_MODULE_0__["default"];
treeProto.y = _y_js__WEBPACK_IMPORTED_MODULE_1__["default"];

/***/ }),

/***/ 38632:
/*!************************************************!*\
  !*** ./node_modules/d3-quadtree/src/remove.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "removeAll": () => (/* binding */ removeAll)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

  var parent,
    node = this._root,
    retainer,
    previous,
    next,
    x0 = this._x0,
    y0 = this._y0,
    x1 = this._x1,
    y1 = this._y1,
    x,
    y,
    xm,
    ym,
    right,
    bottom,
    i,
    j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return this;

  // Find the leaf node for the point.
  // While descending, also retain the deepest parent with a non-removed sibling.
  if (node.length) while (true) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3]) retainer = parent, j = i;
  }

  // Find the point to remove.
  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
  if (next = node.next) delete node.next;

  // If there are multiple coincident points, remove just the point.
  if (previous) return next ? previous.next = next : delete previous.next, this;

  // If this is the root point, remove it.
  if (!parent) return this._root = next, this;

  // Remove this leaf.
  next ? parent[i] = next : delete parent[i];

  // If the parent now contains exactly one leaf, collapse superfluous parents.
  if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer) retainer[j] = node;else this._root = node;
  }
  return this;
}
function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
  return this;
}

/***/ }),

/***/ 41850:
/*!**********************************************!*\
  !*** ./node_modules/d3-quadtree/src/root.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  return this._root;
}

/***/ }),

/***/ 53153:
/*!**********************************************!*\
  !*** ./node_modules/d3-quadtree/src/size.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__() {
  var size = 0;
  this.visit(function (node) {
    if (!node.length) do ++size; while (node = node.next);
  });
  return size;
}

/***/ }),

/***/ 61524:
/*!***********************************************!*\
  !*** ./node_modules/d3-quadtree/src/visit.js ***!
  \***********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _quad_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./quad.js */ 84591);

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(callback) {
  var quads = [],
    q,
    node = this._root,
    child,
    x0,
    y0,
    x1,
    y1;
  if (node) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2,
        ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, x0, y0, xm, ym));
    }
  }
  return this;
}

/***/ }),

/***/ 18741:
/*!****************************************************!*\
  !*** ./node_modules/d3-quadtree/src/visitAfter.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _quad_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./quad.js */ 84591);

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(callback) {
  var quads = [],
    next = [],
    q;
  if (this._root) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child,
        x0 = q.x0,
        y0 = q.y0,
        x1 = q.x1,
        y1 = q.y1,
        xm = (x0 + x1) / 2,
        ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new _quad_js__WEBPACK_IMPORTED_MODULE_0__["default"](child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}

/***/ }),

/***/ 44831:
/*!*******************************************!*\
  !*** ./node_modules/d3-quadtree/src/x.js ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "defaultX": () => (/* binding */ defaultX)
/* harmony export */ });
function defaultX(d) {
  return d[0];
}
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}

/***/ }),

/***/ 98032:
/*!*******************************************!*\
  !*** ./node_modules/d3-quadtree/src/y.js ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "defaultY": () => (/* binding */ defaultY)
/* harmony export */ });
function defaultY(d) {
  return d[1];
}
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}

/***/ })

}]);