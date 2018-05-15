require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"VRComponent":[function(require,module,exports){
"\nVRComponent class\n\nproperties\n- front (set: imagePath <string>, get: layer)\n- right\n- back\n- left\n- top\n- bottom\n- heading <number>\n- elevation <number>\n- tilt <number> readonly\n\n- panning <bool>\n- mobilePanning <bool>\n- arrowKeys <bool>\n\n- lookAtLatestProjectedLayer <bool>\n\nmethods\n- projectLayer(layer) # heading and elevation are set as properties on the layer\n- hideEnviroment()\n\nevents\n- onOrientationChange (data {heading, elevation, tilt})\n\n--------------------------------------------------------------------------------\n\nVRLayer class\n\nproperties\n- heading <number> (from 0 up to 360)\n- elevation <number> (from -90 down to 90 up)\n";
var KEYS, KEYSDOWN, SIDES, VRAnchorLayer,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

SIDES = ["north", "front", "east", "right", "south", "back", "west", "left", "top", "bottom"];

KEYS = {
  LeftArrow: 37,
  UpArrow: 38,
  RightArrow: 39,
  DownArrow: 40
};

KEYSDOWN = {
  left: false,
  up: false,
  right: false,
  down: false
};

Events.OrientationDidChange = "orientationdidchange";

VRAnchorLayer = (function(superClass) {
  extend(VRAnchorLayer, superClass);

  function VRAnchorLayer(layer, cubeSide) {
    VRAnchorLayer.__super__.constructor.call(this);
    this.width = 2;
    this.height = 2;
    this.clip = false;
    this.name = "anchor";
    this.cubeSide = cubeSide;
    this.backgroundColor = null;
    this.layer = layer;
    layer.parent = this;
    layer.center();
    layer.on("change:orientation", (function(_this) {
      return function(newValue, layer) {
        return _this.updatePosition(layer);
      };
    })(this));
    this.updatePosition(layer);
    layer._context.on("layer:destroy", (function(_this) {
      return function(layer) {
        if (layer === _this.layer) {
          return _this.destroy();
        }
      };
    })(this));
  }

  VRAnchorLayer.prototype.updatePosition = function(layer) {
    var dpr, halfCubeSide, x, y, z;
    halfCubeSide = this.cubeSide / 2;
    dpr = Framer.CurrentContext.pixelMultiplier;
    x = ((this.cubeSide - this.width) / 2) * dpr;
    y = ((this.cubeSide - this.height) / 2) * dpr;
    z = layer.distance * dpr;
    return this.style.WebkitTransform = "translateX(" + x + "px) translateY(" + y + "px) rotateZ(" + layer.heading + "deg) rotateX(" + (90 - layer.elevation) + "deg) translateZ(" + z + "px) rotateX(180deg)";
  };

  return VRAnchorLayer;

})(Layer);

exports.VRLayer = (function(superClass) {
  extend(VRLayer, superClass);

  function VRLayer(options) {
    if (options == null) {
      options = {};
    }
    options = _.defaults(options, {
      heading: 0,
      elevation: 0
    });
    VRLayer.__super__.constructor.call(this, options);
  }

  VRLayer.define("heading", {
    get: function() {
      return this._heading;
    },
    set: function(value) {
      var rest, roundedValue;
      if (value >= 360) {
        value = value % 360;
      } else if (value < 0) {
        rest = Math.abs(value) % 360;
        value = 360 - rest;
      }
      roundedValue = Math.round(value * 1000) / 1000;
      if (this._heading !== roundedValue) {
        this._heading = roundedValue;
        this.emit("change:heading", this._heading);
        return this.emit("change:orientation", this._heading);
      }
    }
  });

  VRLayer.define("elevation", {
    get: function() {
      return this._elevation;
    },
    set: function(value) {
      var roundedValue;
      value = Utils.clamp(value, -90, 90);
      roundedValue = Math.round(value * 1000) / 1000;
      if (roundedValue !== this._elevation) {
        this._elevation = roundedValue;
        this.emit("change:elevation", roundedValue);
        return this.emit("change:orientation", roundedValue);
      }
    }
  });

  VRLayer.define("distance", {
    get: function() {
      return this._distance;
    },
    set: function(value) {
      if (value !== this._distance) {
        this._distance = value;
        this.emit("change:distance", value);
        return this.emit("change:orientation", value);
      }
    }
  });

  return VRLayer;

})(Layer);

exports.VRComponent = (function(superClass) {
  extend(VRComponent, superClass);

  function VRComponent(options) {
    if (options == null) {
      options = {};
    }
    this._emitOrientationDidChangeEvent = bind(this._emitOrientationDidChangeEvent, this);
    this.setupPan = bind(this.setupPan, this);
    this._canvasToComponentRatio = bind(this._canvasToComponentRatio, this);
    this.deviceOrientationUpdate = bind(this.deviceOrientationUpdate, this);
    this.createCube = bind(this.createCube, this);
    this.setupDefaultValues = bind(this.setupDefaultValues, this);
    options = _.defaults(options, {
      cubeSide: 1500,
      perspective: 600,
      lookAtLatestProjectedLayer: false,
      width: Screen.width,
      height: Screen.height,
      arrowKeys: true,
      panning: true,
      mobilePanning: true,
      flat: true,
      clip: true
    });
    VRComponent.__super__.constructor.call(this, options);
    Screen.backgroundColor = "black";
    Screen.perspective = 0;
    this.setupDefaultValues();
    this.degToRad = Math.PI / 180;
    this.backgroundColor = null;
    this.createCube(options.cubeSide);
    this.lookAtLatestProjectedLayer = options.lookAtLatestProjectedLayer;
    this.setupKeys(options.arrowKeys);
    if (options.heading != null) {
      this.heading = options.heading;
    }
    if (options.elevation != null) {
      this.elevation = options.elevation;
    }
    this.setupPan(options.panning);
    this.mobilePanning = options.mobilePanning;
    if (Utils.isMobile()) {
      window.addEventListener("deviceorientation", (function(_this) {
        return function(event) {
          return _this.orientationData = event;
        };
      })(this));
    }
    Framer.Loop.on("update", this.deviceOrientationUpdate);
    Framer.CurrentContext.on("reset", function() {
      return Framer.Loop.off("update", this.deviceOrientationUpdate);
    });
    this.on("change:frame", function() {
      return this.desktopPan(0, 0);
    });
  }

  VRComponent.prototype.setupDefaultValues = function() {
    this._heading = 0;
    this._elevation = 0;
    this._tilt = 0;
    this._headingOffset = 0;
    this._elevationOffset = 0;
    this._deviceHeading = 0;
    return this._deviceElevation = 0;
  };

  VRComponent.prototype.setupKeys = function(enabled) {
    this.arrowKeys = enabled;
    document.addEventListener("keydown", (function(_this) {
      return function(event) {
        switch (event.which) {
          case KEYS.UpArrow:
            KEYSDOWN.up = true;
            return event.preventDefault();
          case KEYS.DownArrow:
            KEYSDOWN.down = true;
            return event.preventDefault();
          case KEYS.LeftArrow:
            KEYSDOWN.left = true;
            return event.preventDefault();
          case KEYS.RightArrow:
            KEYSDOWN.right = true;
            return event.preventDefault();
        }
      };
    })(this));
    document.addEventListener("keyup", (function(_this) {
      return function(event) {
        switch (event.which) {
          case KEYS.UpArrow:
            KEYSDOWN.up = false;
            return event.preventDefault();
          case KEYS.DownArrow:
            KEYSDOWN.down = false;
            return event.preventDefault();
          case KEYS.LeftArrow:
            KEYSDOWN.left = false;
            return event.preventDefault();
          case KEYS.RightArrow:
            KEYSDOWN.right = false;
            return event.preventDefault();
        }
      };
    })(this));
    return window.onblur = function() {
      KEYSDOWN.up = false;
      KEYSDOWN.down = false;
      KEYSDOWN.left = false;
      return KEYSDOWN.right = false;
    };
  };

  VRComponent.define("heading", {
    get: function() {
      var heading, rest;
      heading = this._heading + this._headingOffset;
      if (heading > 360) {
        heading = heading % 360;
      } else if (heading < 0) {
        rest = Math.abs(heading) % 360;
        heading = 360 - rest;
      }
      return Math.round(heading * 1000) / 1000;
    },
    set: function(value) {
      return this.lookAt(value, this._elevation);
    }
  });

  VRComponent.define("elevation", {
    get: function() {
      return Math.round(this._elevation * 1000) / 1000;
    },
    set: function(value) {
      value = Utils.clamp(value, -90, 90);
      return this.lookAt(this._heading, value);
    }
  });

  VRComponent.define("tilt", {
    get: function() {
      return this._tilt;
    },
    set: function(value) {
      throw "Tilt is readonly";
    }
  });

  SIDES.map(function(face) {
    return VRComponent.define(face, {
      get: function() {
        return this.layerFromFace(face);
      },
      set: function(value) {
        return this.setImage(face, value);
      }
    });
  });

  VRComponent.prototype.createCube = function(cubeSide) {
    var colors, halfCubeSide, i, key, ref, results, rotationX, rotationY, side, sideIndex, sideNames;
    if (cubeSide == null) {
      cubeSide = this.cubeSide;
    }
    this.cubeSide = cubeSide;
    if ((ref = this.world) != null) {
      ref.destroy();
    }
    this.world = new Layer({
      name: "world",
      superLayer: this,
      size: cubeSide,
      backgroundColor: null,
      clip: false
    });
    this.world.center();
    this.sides = [];
    halfCubeSide = this.cubeSide / 2;
    colors = ["#866ccc", "#28affa", "#2dd7aa", "#ffc22c", "#7ddd11", "#f95faa"];
    sideNames = ["front", "right", "back", "left", "top", "bottom"];
    for (sideIndex = i = 0; i < 6; sideIndex = ++i) {
      rotationX = 0;
      if (indexOf.call([0, 1, 2, 3], sideIndex) >= 0) {
        rotationX = -90;
      }
      if (sideIndex === 4) {
        rotationX = 180;
      }
      rotationY = 0;
      if (indexOf.call([0, 1, 2, 3], sideIndex) >= 0) {
        rotationY = sideIndex * -90;
      }
      side = new Layer({
        size: cubeSide,
        z: -halfCubeSide,
        originZ: halfCubeSide,
        rotationX: rotationX,
        rotationY: rotationY,
        parent: this.world,
        name: sideNames[sideIndex],
        html: sideNames[sideIndex],
        color: "white",
        backgroundColor: colors[sideIndex],
        style: {
          lineHeight: cubeSide + "px",
          textAlign: "center",
          fontSize: (cubeSide / 10) + "px",
          fontWeight: "100",
          fontFamily: "Helvetica Neue"
        }
      });
      this.sides.push(side);
      side._backgroundColor = side.backgroundColor;
    }
    results = [];
    for (key in this.sideImages) {
      if (this.sideImages != null) {
        results.push(this.setImage(key, this.sideImages[key]));
      }
    }
    return results;
  };

  VRComponent.prototype.hideEnviroment = function() {
    var i, len, ref, results, side;
    ref = this.sides;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      side = ref[i];
      results.push(side.destroy());
    }
    return results;
  };

  VRComponent.prototype.layerFromFace = function(face) {
    var map;
    if (this.sides == null) {
      return;
    }
    map = {
      north: this.sides[0],
      front: this.sides[0],
      east: this.sides[1],
      right: this.sides[1],
      south: this.sides[2],
      back: this.sides[2],
      west: this.sides[3],
      left: this.sides[3],
      top: this.sides[4],
      bottom: this.sides[5]
    };
    return map[face];
  };

  VRComponent.prototype.setImage = function(face, imagePath) {
    var layer;
    if (indexOf.call(SIDES, face) < 0) {
      throw Error("VRComponent setImage, wrong name for face: " + face + ", valid options: front, right, back, left, top, bottom, north, east, south, west");
    }
    if (this.sideImages == null) {
      this.sideImages = {};
    }
    this.sideImages[face] = imagePath;
    layer = this.layerFromFace(face);
    if (imagePath != null) {
      if (layer != null) {
        layer.html = "";
      }
      return layer != null ? layer.image = imagePath : void 0;
    } else {
      if (layer != null) {
        layer.html = layer != null ? layer.name : void 0;
      }
      return layer != null ? layer.backgroundColor = layer != null ? layer._backgroundColor : void 0 : void 0;
    }
  };

  VRComponent.prototype.getImage = function(face) {
    var layer;
    if (indexOf.call(SIDES, face) < 0) {
      throw Error("VRComponent getImage, wrong name for face: " + face + ", valid options: front, right, back, left, top, bottom, north, east, south, west");
    }
    layer = this.layerFromFace(face);
    if (layer != null) {
      return layer.image;
    }
  };

  VRComponent.prototype.projectLayer = function(insertLayer) {
    var anchor, distance, elevation, heading, rest;
    heading = insertLayer.heading;
    if (heading == null) {
      heading = 0;
    }
    if (heading >= 360) {
      heading = value % 360;
    } else if (heading < 0) {
      rest = Math.abs(heading) % 360;
      heading = 360 - rest;
    }
    elevation = insertLayer.elevation;
    if (elevation == null) {
      elevation = 0;
    }
    elevation = Utils.clamp(elevation, -90, 90);
    distance = insertLayer.distance;
    if (distance == null) {
      distance = 600;
    }
    insertLayer.heading = heading;
    insertLayer.elevation = elevation;
    insertLayer.distance = distance;
    anchor = new VRAnchorLayer(insertLayer, this.cubeSide);
    anchor.superLayer = this.world;
    if (this.lookAtLatestProjectedLayer) {
      return this.lookAt(heading, elevation);
    }
  };

  VRComponent.prototype.deviceOrientationUpdate = function() {
    var alpha, beta, date, diff, gamma, halfCubeSide, orientation, rotation, translationX, translationY, translationZ, x, xAngle, yAngle, zAngle;
    if (Utils.isDesktop()) {
      if (this.arrowKeys) {
        if (this._lastCallHorizontal === void 0) {
          this._lastCallHorizontal = 0;
          this._lastCallVertical = 0;
          this._accelerationHorizontal = 1;
          this._accelerationVertical = 1;
          this._goingUp = false;
          this._goingLeft = false;
        }
        date = new Date();
        x = .1;
        if (KEYSDOWN.up || KEYSDOWN.down) {
          diff = date - this._lastCallVertical;
          if (diff < 30) {
            if (this._accelerationVertical < 30) {
              this._accelerationVertical += 0.18;
            }
          }
          if (KEYSDOWN.up) {
            if (this._goingUp === false) {
              this._accelerationVertical = 1;
              this._goingUp = true;
            }
            this.desktopPan(0, 1 * this._accelerationVertical * x);
          } else {
            if (this._goingUp === true) {
              this._accelerationVertical = 1;
              this._goingUp = false;
            }
            this.desktopPan(0, -1 * this._accelerationVertical * x);
          }
          this._lastCallVertical = date;
        } else {
          this._accelerationVertical = 1;
        }
        if (KEYSDOWN.left || KEYSDOWN.right) {
          diff = date - this._lastCallHorizontal;
          if (diff < 30) {
            if (this._accelerationHorizontal < 25) {
              this._accelerationHorizontal += 0.18;
            }
          }
          if (KEYSDOWN.left) {
            if (this._goingLeft === false) {
              this._accelerationHorizontal = 1;
              this._goingLeft = true;
            }
            this.desktopPan(1 * this._accelerationHorizontal * x, 0);
          } else {
            if (this._goingLeft === true) {
              this._accelerationHorizontal = 1;
              this._goingLeft = false;
            }
            this.desktopPan(-1 * this._accelerationHorizontal * x, 0);
          }
          return this._lastCallHorizontal = date;
        } else {
          return this._accelerationHorizontal = 1;
        }
      }
    } else if (this.orientationData != null) {
      alpha = this.orientationData.alpha;
      beta = this.orientationData.beta;
      gamma = this.orientationData.gamma;
      if (alpha !== 0 && beta !== 0 && gamma !== 0) {
        this.directionParams(alpha, beta, gamma);
      }
      xAngle = beta;
      yAngle = -gamma;
      zAngle = alpha;
      halfCubeSide = this.cubeSide / 2;
      orientation = "rotate(" + (window.orientation * -1) + "deg) ";
      translationX = "translateX(" + (((this.width / 2) - halfCubeSide) * Framer.CurrentContext.pixelMultiplier) + "px)";
      translationY = " translateY(" + (((this.height / 2) - halfCubeSide) * Framer.CurrentContext.pixelMultiplier) + "px)";
      translationZ = " translateZ(" + (this.perspective * Framer.CurrentContext.pixelMultiplier) + "px)";
      rotation = translationZ + translationX + translationY + orientation + (" rotateY(" + yAngle + "deg) rotateX(" + xAngle + "deg) rotateZ(" + zAngle + "deg)") + (" rotateZ(" + (-this._headingOffset) + "deg)");
      return this.world.style["webkitTransform"] = rotation;
    }
  };

  VRComponent.prototype.directionParams = function(alpha, beta, gamma) {
    var alphaRad, betaRad, cA, cB, cG, cH, elevation, gammaRad, heading, orientationTiltOffset, sA, sB, sG, tilt, xrA, xrB, xrC, yrA, yrB, yrC, zrA, zrB, zrC;
    alphaRad = alpha * this.degToRad;
    betaRad = beta * this.degToRad;
    gammaRad = gamma * this.degToRad;
    cA = Math.cos(alphaRad);
    sA = Math.sin(alphaRad);
    cB = Math.cos(betaRad);
    sB = Math.sin(betaRad);
    cG = Math.cos(gammaRad);
    sG = Math.sin(gammaRad);
    xrA = -sA * sB * sG + cA * cG;
    xrB = cA * sB * sG + sA * cG;
    xrC = cB * sG;
    yrA = -sA * cB;
    yrB = cA * cB;
    yrC = -sB;
    zrA = -sA * sB * cG - cA * sG;
    zrB = cA * sB * cG - sA * sG;
    zrC = cB * cG;
    heading = Math.atan(zrA / zrB);
    if (zrB < 0) {
      heading += Math.PI;
    } else if (zrA < 0) {
      heading += 2 * Math.PI;
    }
    elevation = Math.PI / 2 - Math.acos(-zrC);
    cH = Math.sqrt(1 - (zrC * zrC));
    tilt = Math.acos(-xrC / cH) * Math.sign(yrC);
    heading *= 180 / Math.PI;
    elevation *= 180 / Math.PI;
    tilt *= 180 / Math.PI;
    this._heading = Math.round(heading * 1000) / 1000;
    this._elevation = Math.round(elevation * 1000) / 1000;
    tilt = Math.round(tilt * 1000) / 1000;
    orientationTiltOffset = (window.orientation * -1) + 90;
    tilt += orientationTiltOffset;
    if (tilt > 180) {
      tilt -= 360;
    }
    this._tilt = tilt;
    this._deviceHeading = this._heading;
    this._deviceElevation = this._elevation;
    return this._emitOrientationDidChangeEvent();
  };

  VRComponent.prototype._canvasToComponentRatio = function() {
    var pointA, pointB, xDist, yDist;
    pointA = Utils.convertPointFromContext({
      x: 0,
      y: 0
    }, this, true);
    pointB = Utils.convertPointFromContext({
      x: 1,
      y: 1
    }, this, true);
    xDist = Math.abs(pointA.x - pointB.x);
    yDist = Math.abs(pointA.y - pointB.y);
    return {
      x: xDist,
      y: yDist
    };
  };

  VRComponent.prototype.setupPan = function(enabled) {
    this.panning = enabled;
    this.desktopPan(0, 0);
    this.onMouseDown((function(_this) {
      return function() {
        return _this.animateStop();
      };
    })(this));
    this.onPan((function(_this) {
      return function(data) {
        var deltaX, deltaY, ratio, strength;
        if (!_this.panning) {
          return;
        }
        ratio = _this._canvasToComponentRatio();
        deltaX = data.deltaX * ratio.x;
        deltaY = data.deltaY * ratio.y;
        strength = Utils.modulate(_this.perspective, [1200, 900], [22, 17.5]);
        if (Utils.isMobile()) {
          if (_this.mobilePanning) {
            _this._headingOffset -= deltaX / strength;
          }
        } else {
          _this.desktopPan(deltaX / strength, deltaY / strength);
        }
        _this._prevVeloX = data.velocityX;
        return _this._prevVeloU = data.velocityY;
      };
    })(this));
    return this.onPanEnd((function(_this) {
      return function(data) {
        var ratio, strength, velocityX, velocityY;
        if (!_this.panning || Utils.isMobile()) {
          return;
        }
        ratio = _this._canvasToComponentRatio();
        velocityX = (data.velocityX + _this._prevVeloX) * 0.5;
        velocityY = (data.velocityY + _this._prevVeloY) * 0.5;
        velocityX *= velocityX;
        velocityY *= velocityY;
        velocityX *= ratio.x;
        velocityY *= ratio.y;
        strength = Utils.modulate(_this.perspective, [1200, 900], [22, 17.5]);
        return _this.animate({
          heading: _this.heading - (data.velocityX * ratio.x * 200) / strength,
          elevation: _this.elevation + (data.velocityY * ratio.y * 200) / strength,
          options: {
            curve: "spring(300,100)"
          }
        });
      };
    })(this));
  };

  VRComponent.prototype.desktopPan = function(deltaDir, deltaHeight) {
    var halfCubeSide, rotation, translationX, translationY, translationZ;
    halfCubeSide = this.cubeSide / 2;
    translationX = "translateX(" + (((this.width / 2) - halfCubeSide) * Framer.CurrentContext.pixelMultiplier) + "px)";
    translationY = " translateY(" + (((this.height / 2) - halfCubeSide) * Framer.CurrentContext.pixelMultiplier) + "px)";
    translationZ = " translateZ(" + (this.perspective * Framer.CurrentContext.pixelMultiplier) + "px)";
    this._heading -= deltaDir;
    if (this._heading > 360) {
      this._heading -= 360;
    } else if (this._heading < 0) {
      this._heading += 360;
    }
    this._elevation += deltaHeight;
    this._elevation = Utils.clamp(this._elevation, -90, 90);
    rotation = translationZ + translationX + translationY + (" rotateX(" + (this._elevation + 90) + "deg) rotateZ(" + (360 - this._heading) + "deg)") + (" rotateZ(" + (-this._headingOffset) + "deg)");
    this.world.style["webkitTransform"] = rotation;
    return this._emitOrientationDidChangeEvent();
  };

  VRComponent.prototype.lookAt = function(heading, elevation) {
    var halfCubeSide, ref, rotation, translationX, translationY, translationZ;
    halfCubeSide = this.cubeSide / 2;
    translationX = "translateX(" + (((this.width / 2) - halfCubeSide) * Framer.CurrentContext.pixelMultiplier) + "px)";
    translationY = " translateY(" + (((this.height / 2) - halfCubeSide) * Framer.CurrentContext.pixelMultiplier) + "px)";
    translationZ = " translateZ(" + (this.perspective * Framer.CurrentContext.pixelMultiplier) + "px)";
    rotation = translationZ + translationX + translationY + (" rotateZ(" + this._tilt + "deg) rotateX(" + (elevation + 90) + "deg) rotateZ(" + (-heading) + "deg)");
    if ((ref = this.world) != null) {
      ref.style["webkitTransform"] = rotation;
    }
    this._heading = heading;
    this._elevation = elevation;
    if (Utils.isMobile()) {
      this._headingOffset = this._heading - this._deviceHeading;
    }
    this._elevationOffset = this._elevation - this._deviceElevation;
    heading = this._heading;
    if (heading < 0) {
      heading += 360;
    } else if (heading > 360) {
      heading -= 360;
    }
    return this._emitOrientationDidChangeEvent();
  };

  VRComponent.prototype._emitOrientationDidChangeEvent = function() {
    return this.emit(Events.OrientationDidChange, {
      heading: this.heading,
      elevation: this.elevation,
      tilt: this.tilt
    });
  };

  VRComponent.prototype.onOrientationChange = function(cb) {
    return this.on(Events.OrientationDidChange, cb);
  };

  return VRComponent;

})(Layer);


},{}],"myModule":[function(require,module,exports){
exports.myVar = "myVariable";

exports.myFunction = function() {
  return print("myFunction is running");
};

exports.myArray = [1, 2, 3];


},{}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWVyLm1vZHVsZXMuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2pvbmFzdHJldWIvRG9jdW1lbnRzL1RVIERlbGZ0L1dvcmtzaG9wLzguIFZSL1ZSLmZyYW1lci9tb2R1bGVzL215TW9kdWxlLmNvZmZlZSIsIi4uLy4uLy4uLy4uLy4uL1VzZXJzL2pvbmFzdHJldWIvRG9jdW1lbnRzL1RVIERlbGZ0L1dvcmtzaG9wLzguIFZSL1ZSLmZyYW1lci9tb2R1bGVzL1ZSQ29tcG9uZW50LmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiIyBBZGQgdGhlIGZvbGxvd2luZyBsaW5lIHRvIHlvdXIgcHJvamVjdCBpbiBGcmFtZXIgU3R1ZGlvLiBcbiMgbXlNb2R1bGUgPSByZXF1aXJlIFwibXlNb2R1bGVcIlxuIyBSZWZlcmVuY2UgdGhlIGNvbnRlbnRzIGJ5IG5hbWUsIGxpa2UgbXlNb2R1bGUubXlGdW5jdGlvbigpIG9yIG15TW9kdWxlLm15VmFyXG5cbmV4cG9ydHMubXlWYXIgPSBcIm15VmFyaWFibGVcIlxuXG5leHBvcnRzLm15RnVuY3Rpb24gPSAtPlxuXHRwcmludCBcIm15RnVuY3Rpb24gaXMgcnVubmluZ1wiXG5cbmV4cG9ydHMubXlBcnJheSA9IFsxLCAyLCAzXSIsIlwiXCJcIlxuXG5WUkNvbXBvbmVudCBjbGFzc1xuXG5wcm9wZXJ0aWVzXG4tIGZyb250IChzZXQ6IGltYWdlUGF0aCA8c3RyaW5nPiwgZ2V0OiBsYXllcilcbi0gcmlnaHRcbi0gYmFja1xuLSBsZWZ0XG4tIHRvcFxuLSBib3R0b21cbi0gaGVhZGluZyA8bnVtYmVyPlxuLSBlbGV2YXRpb24gPG51bWJlcj5cbi0gdGlsdCA8bnVtYmVyPiByZWFkb25seVxuXG4tIHBhbm5pbmcgPGJvb2w+XG4tIG1vYmlsZVBhbm5pbmcgPGJvb2w+XG4tIGFycm93S2V5cyA8Ym9vbD5cblxuLSBsb29rQXRMYXRlc3RQcm9qZWN0ZWRMYXllciA8Ym9vbD5cblxubWV0aG9kc1xuLSBwcm9qZWN0TGF5ZXIobGF5ZXIpICMgaGVhZGluZyBhbmQgZWxldmF0aW9uIGFyZSBzZXQgYXMgcHJvcGVydGllcyBvbiB0aGUgbGF5ZXJcbi0gaGlkZUVudmlyb21lbnQoKVxuXG5ldmVudHNcbi0gb25PcmllbnRhdGlvbkNoYW5nZSAoZGF0YSB7aGVhZGluZywgZWxldmF0aW9uLCB0aWx0fSlcblxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuVlJMYXllciBjbGFzc1xuXG5wcm9wZXJ0aWVzXG4tIGhlYWRpbmcgPG51bWJlcj4gKGZyb20gMCB1cCB0byAzNjApXG4tIGVsZXZhdGlvbiA8bnVtYmVyPiAoZnJvbSAtOTAgZG93biB0byA5MCB1cClcblxuXCJcIlwiXG5cblNJREVTID0gW1xuXHRcIm5vcnRoXCIsXG5cdFwiZnJvbnRcIixcblx0XCJlYXN0XCIsXG5cdFwicmlnaHRcIixcblx0XCJzb3V0aFwiLFxuXHRcImJhY2tcIixcblx0XCJ3ZXN0XCIsXG5cdFwibGVmdFwiLFxuXHRcInRvcFwiLFxuXHRcImJvdHRvbVwiLFxuXVxuXG5LRVlTID0ge1xuXHRMZWZ0QXJyb3c6IDM3XG5cdFVwQXJyb3c6IDM4XG5cdFJpZ2h0QXJyb3c6IDM5XG5cdERvd25BcnJvdzogNDBcbn1cblxuS0VZU0RPV04gPSB7XG5cdGxlZnQ6IGZhbHNlXG5cdHVwOiBmYWxzZVxuXHRyaWdodDogZmFsc2Vcblx0ZG93bjogZmFsc2Vcbn1cblxuRXZlbnRzLk9yaWVudGF0aW9uRGlkQ2hhbmdlID0gXCJvcmllbnRhdGlvbmRpZGNoYW5nZVwiXG5cbmNsYXNzIFZSQW5jaG9yTGF5ZXIgZXh0ZW5kcyBMYXllclxuXG5cdGNvbnN0cnVjdG9yOiAobGF5ZXIsIGN1YmVTaWRlKSAtPlxuXHRcdHN1cGVyKClcblx0XHRAd2lkdGggPSAyXG5cdFx0QGhlaWdodCA9IDJcblx0XHRAY2xpcCA9IGZhbHNlXG5cdFx0QG5hbWUgPSBcImFuY2hvclwiXG5cdFx0QGN1YmVTaWRlID0gY3ViZVNpZGVcblx0XHRAYmFja2dyb3VuZENvbG9yID0gbnVsbFxuXG5cdFx0QGxheWVyID0gbGF5ZXJcblx0XHRsYXllci5wYXJlbnQgPSBAXG5cdFx0bGF5ZXIuY2VudGVyKClcblxuXHRcdGxheWVyLm9uIFwiY2hhbmdlOm9yaWVudGF0aW9uXCIsIChuZXdWYWx1ZSwgbGF5ZXIpID0+IEB1cGRhdGVQb3NpdGlvbihsYXllcilcblx0XHRAdXBkYXRlUG9zaXRpb24obGF5ZXIpXG5cblx0XHRsYXllci5fY29udGV4dC5vbiBcImxheWVyOmRlc3Ryb3lcIiwgKGxheWVyKSA9PiBAZGVzdHJveSgpIGlmIGxheWVyIGlzIEBsYXllclxuXG5cdHVwZGF0ZVBvc2l0aW9uOiAobGF5ZXIpIC0+XG5cdFx0aGFsZkN1YmVTaWRlID0gQGN1YmVTaWRlIC8gMlxuXHRcdGRwciA9IEZyYW1lci5DdXJyZW50Q29udGV4dC5waXhlbE11bHRpcGxpZXJcblx0XHR4ID0gKChAY3ViZVNpZGUgLSBAd2lkdGgpIC8gMikgKiBkcHJcblx0XHR5ID0gKChAY3ViZVNpZGUgLSBAaGVpZ2h0KSAvIDIpICogZHByXG5cdFx0eiA9IGxheWVyLmRpc3RhbmNlICogZHByXG5cdFx0QHN0eWxlLldlYmtpdFRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWCgje3h9cHgpIHRyYW5zbGF0ZVkoI3t5fXB4KSByb3RhdGVaKCN7bGF5ZXIuaGVhZGluZ31kZWcpIHJvdGF0ZVgoI3s5MC1sYXllci5lbGV2YXRpb259ZGVnKSB0cmFuc2xhdGVaKCN7en1weCkgcm90YXRlWCgxODBkZWcpXCJcblxuY2xhc3MgZXhwb3J0cy5WUkxheWVyIGV4dGVuZHMgTGF5ZXJcblxuXHRjb25zdHJ1Y3RvcjogKG9wdGlvbnMgPSB7fSkgLT5cblx0XHRvcHRpb25zID0gXy5kZWZhdWx0cyBvcHRpb25zLFxuXHRcdFx0aGVhZGluZzogMFxuXHRcdFx0ZWxldmF0aW9uOiAwXG5cdFx0c3VwZXIgb3B0aW9uc1xuXG5cdEBkZWZpbmUgXCJoZWFkaW5nXCIsXG5cdFx0Z2V0OiAtPiBAX2hlYWRpbmdcblx0XHRzZXQ6ICh2YWx1ZSkgLT5cblx0XHRcdGlmIHZhbHVlID49IDM2MFxuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlICUgMzYwXG5cdFx0XHRlbHNlIGlmIHZhbHVlIDwgMFxuXHRcdFx0XHRyZXN0ID0gTWF0aC5hYnModmFsdWUpICUgMzYwXG5cdFx0XHRcdHZhbHVlID0gMzYwIC0gcmVzdFxuXHRcdFx0cm91bmRlZFZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMDApIC8gMTAwMFxuXHRcdFx0aWYgQF9oZWFkaW5nIGlzbnQgcm91bmRlZFZhbHVlXG5cdFx0XHRcdEBfaGVhZGluZyA9IHJvdW5kZWRWYWx1ZVxuXHRcdFx0XHRAZW1pdChcImNoYW5nZTpoZWFkaW5nXCIsIEBfaGVhZGluZylcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6b3JpZW50YXRpb25cIiwgQF9oZWFkaW5nKVxuXG5cdEBkZWZpbmUgXCJlbGV2YXRpb25cIixcblx0XHRnZXQ6IC0+IEBfZWxldmF0aW9uXG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHR2YWx1ZSA9IFV0aWxzLmNsYW1wKHZhbHVlLCAtOTAsIDkwKVxuXHRcdFx0cm91bmRlZFZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMDApIC8gMTAwMFxuXHRcdFx0aWYgcm91bmRlZFZhbHVlIGlzbnQgQF9lbGV2YXRpb25cblx0XHRcdFx0QF9lbGV2YXRpb24gPSByb3VuZGVkVmFsdWVcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6ZWxldmF0aW9uXCIsIHJvdW5kZWRWYWx1ZSlcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6b3JpZW50YXRpb25cIiwgcm91bmRlZFZhbHVlKVxuXG5cdEBkZWZpbmUgXCJkaXN0YW5jZVwiLFxuXHRcdGdldDogLT4gQF9kaXN0YW5jZVxuXHRcdHNldDogKHZhbHVlKSAtPlxuXHRcdFx0aWYgdmFsdWUgaXNudCBAX2Rpc3RhbmNlXG5cdFx0XHRcdEBfZGlzdGFuY2UgPSB2YWx1ZVxuXHRcdFx0XHRAZW1pdChcImNoYW5nZTpkaXN0YW5jZVwiLCB2YWx1ZSlcblx0XHRcdFx0QGVtaXQoXCJjaGFuZ2U6b3JpZW50YXRpb25cIiwgdmFsdWUpXG5cbmNsYXNzIGV4cG9ydHMuVlJDb21wb25lbnQgZXh0ZW5kcyBMYXllclxuXG5cdGNvbnN0cnVjdG9yOiAob3B0aW9ucyA9IHt9KSAtPlxuXHRcdG9wdGlvbnMgPSBfLmRlZmF1bHRzIG9wdGlvbnMsXG5cdFx0XHRjdWJlU2lkZTogMTUwMFxuXHRcdFx0cGVyc3BlY3RpdmU6IDYwMFxuXHRcdFx0bG9va0F0TGF0ZXN0UHJvamVjdGVkTGF5ZXI6IGZhbHNlXG5cdFx0XHR3aWR0aDogU2NyZWVuLndpZHRoXG5cdFx0XHRoZWlnaHQ6IFNjcmVlbi5oZWlnaHRcblx0XHRcdGFycm93S2V5czogdHJ1ZVxuXHRcdFx0cGFubmluZzogdHJ1ZVxuXHRcdFx0bW9iaWxlUGFubmluZzogdHJ1ZVxuXHRcdFx0ZmxhdDogdHJ1ZVxuXHRcdFx0Y2xpcDogdHJ1ZVxuXHRcdHN1cGVyIG9wdGlvbnNcblxuXHRcdCMgdG8gaGlkZSB0aGUgc2VlbXMgd2hlcmUgdGhlIGN1YmUgc3VyZmFjZXMgY29tZSB0b2dldGhlciB3ZSBkaXNhYmxlIHRoZSB2aWV3cG9ydCBwZXJzcGVjdGl2ZSBhbmQgc2V0IGEgYmxhY2sgYmFja2dyb3VuZFxuXHRcdFNjcmVlbi5iYWNrZ3JvdW5kQ29sb3IgPSBcImJsYWNrXCJcblx0XHRTY3JlZW4ucGVyc3BlY3RpdmUgPSAwXG5cblx0XHRAc2V0dXBEZWZhdWx0VmFsdWVzKClcblx0XHRAZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwXG5cdFx0QGJhY2tncm91bmRDb2xvciA9IG51bGxcblxuXHRcdEBjcmVhdGVDdWJlKG9wdGlvbnMuY3ViZVNpZGUpXG5cdFx0QGxvb2tBdExhdGVzdFByb2plY3RlZExheWVyID0gb3B0aW9ucy5sb29rQXRMYXRlc3RQcm9qZWN0ZWRMYXllclxuXHRcdEBzZXR1cEtleXMob3B0aW9ucy5hcnJvd0tleXMpXG5cblx0XHRAaGVhZGluZyA9IG9wdGlvbnMuaGVhZGluZyBpZiBvcHRpb25zLmhlYWRpbmc/XG5cdFx0QGVsZXZhdGlvbiA9IG9wdGlvbnMuZWxldmF0aW9uIGlmIG9wdGlvbnMuZWxldmF0aW9uP1xuXG5cdFx0QHNldHVwUGFuKG9wdGlvbnMucGFubmluZylcblx0XHRAbW9iaWxlUGFubmluZyA9IG9wdGlvbnMubW9iaWxlUGFubmluZ1xuXG5cdFx0aWYgVXRpbHMuaXNNb2JpbGUoKVxuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIgXCJkZXZpY2VvcmllbnRhdGlvblwiLCAoZXZlbnQpID0+IEBvcmllbnRhdGlvbkRhdGEgPSBldmVudFxuXG5cdFx0RnJhbWVyLkxvb3Aub24oXCJ1cGRhdGVcIiwgQGRldmljZU9yaWVudGF0aW9uVXBkYXRlKVxuXG5cdFx0IyBNYWtlIHN1cmUgd2UgcmVtb3ZlIHRoZSB1cGRhdGUgZnJvbSB0aGUgbG9vcCB3aGVuIHdlIGRlc3Ryb3kgdGhlIGNvbnRleHRcblx0XHRGcmFtZXIuQ3VycmVudENvbnRleHQub24gXCJyZXNldFwiLCAtPiBGcmFtZXIuTG9vcC5vZmYoXCJ1cGRhdGVcIiwgQGRldmljZU9yaWVudGF0aW9uVXBkYXRlKVxuXG5cdFx0QG9uIFwiY2hhbmdlOmZyYW1lXCIsIC0+IEBkZXNrdG9wUGFuKDAsMClcblxuXHRzZXR1cERlZmF1bHRWYWx1ZXM6ID0+XG5cblx0XHRAX2hlYWRpbmcgPSAwXG5cdFx0QF9lbGV2YXRpb24gPSAwXG5cdFx0QF90aWx0ID0gMFxuXG5cdFx0QF9oZWFkaW5nT2Zmc2V0ID0gMFxuXHRcdEBfZWxldmF0aW9uT2Zmc2V0ID0gMFxuXHRcdEBfZGV2aWNlSGVhZGluZyA9IDBcblx0XHRAX2RldmljZUVsZXZhdGlvbiA9IDBcblxuXHRzZXR1cEtleXM6IChlbmFibGVkKSAtPlxuXG5cdFx0QGFycm93S2V5cyA9IGVuYWJsZWRcblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgXCJrZXlkb3duXCIsIChldmVudCkgPT5cblx0XHRcdHN3aXRjaCBldmVudC53aGljaFxuXHRcdFx0XHR3aGVuIEtFWVMuVXBBcnJvd1xuXHRcdFx0XHRcdEtFWVNET1dOLnVwID0gdHJ1ZVxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0d2hlbiBLRVlTLkRvd25BcnJvd1xuXHRcdFx0XHRcdEtFWVNET1dOLmRvd24gPSB0cnVlXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHR3aGVuIEtFWVMuTGVmdEFycm93XG5cdFx0XHRcdFx0S0VZU0RPV04ubGVmdCA9IHRydWVcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdHdoZW4gS0VZUy5SaWdodEFycm93XG5cdFx0XHRcdFx0S0VZU0RPV04ucmlnaHQgPSB0cnVlXG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciBcImtleXVwXCIsIChldmVudCkgPT5cblx0XHRcdHN3aXRjaCBldmVudC53aGljaFxuXHRcdFx0XHR3aGVuIEtFWVMuVXBBcnJvd1xuXHRcdFx0XHRcdEtFWVNET1dOLnVwID0gZmFsc2Vcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdHdoZW4gS0VZUy5Eb3duQXJyb3dcblx0XHRcdFx0XHRLRVlTRE9XTi5kb3duID0gZmFsc2Vcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdHdoZW4gS0VZUy5MZWZ0QXJyb3dcblx0XHRcdFx0XHRLRVlTRE9XTi5sZWZ0ID0gZmFsc2Vcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdHdoZW4gS0VZUy5SaWdodEFycm93XG5cdFx0XHRcdFx0S0VZU0RPV04ucmlnaHQgPSBmYWxzZVxuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuXHRcdHdpbmRvdy5vbmJsdXIgPSAtPlxuXHRcdFx0S0VZU0RPV04udXAgPSBmYWxzZVxuXHRcdFx0S0VZU0RPV04uZG93biA9IGZhbHNlXG5cdFx0XHRLRVlTRE9XTi5sZWZ0ID0gZmFsc2Vcblx0XHRcdEtFWVNET1dOLnJpZ2h0ID0gZmFsc2VcblxuXHRAZGVmaW5lIFwiaGVhZGluZ1wiLFxuXHRcdGdldDogLT5cblx0XHRcdGhlYWRpbmcgPSBAX2hlYWRpbmcgKyBAX2hlYWRpbmdPZmZzZXRcblx0XHRcdGlmIGhlYWRpbmcgPiAzNjBcblx0XHRcdFx0aGVhZGluZyA9IGhlYWRpbmcgJSAzNjBcblx0XHRcdGVsc2UgaWYgaGVhZGluZyA8IDBcblx0XHRcdFx0cmVzdCA9IE1hdGguYWJzKGhlYWRpbmcpICUgMzYwXG5cdFx0XHRcdGhlYWRpbmcgPSAzNjAgLSByZXN0XG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZChoZWFkaW5nICogMTAwMCkgLyAxMDAwXG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHRAbG9va0F0KHZhbHVlLCBAX2VsZXZhdGlvbilcblxuXHRAZGVmaW5lIFwiZWxldmF0aW9uXCIsXG5cdFx0Z2V0OiAtPiBNYXRoLnJvdW5kKEBfZWxldmF0aW9uICogMTAwMCkgLyAxMDAwXG5cdFx0c2V0OiAodmFsdWUpIC0+XG5cdFx0XHR2YWx1ZSA9IFV0aWxzLmNsYW1wKHZhbHVlLCAtOTAsIDkwKVxuXHRcdFx0QGxvb2tBdChAX2hlYWRpbmcsIHZhbHVlKVxuXG5cdEBkZWZpbmUgXCJ0aWx0XCIsXG5cdFx0Z2V0OiAtPiBAX3RpbHRcblx0XHRzZXQ6ICh2YWx1ZSkgLT4gdGhyb3cgXCJUaWx0IGlzIHJlYWRvbmx5XCJcblxuXHRTSURFUy5tYXAgKGZhY2UpID0+XG5cdFx0QGRlZmluZSBmYWNlLFxuXHRcdFx0Z2V0OiAtPiBAbGF5ZXJGcm9tRmFjZShmYWNlKSAjIEBnZXRJbWFnZShmYWNlKVxuXHRcdFx0c2V0OiAodmFsdWUpIC0+IEBzZXRJbWFnZShmYWNlLCB2YWx1ZSlcblxuXHRjcmVhdGVDdWJlOiAoY3ViZVNpZGUgPSBAY3ViZVNpZGUpID0+XG5cdFx0QGN1YmVTaWRlID0gY3ViZVNpZGVcblxuXHRcdEB3b3JsZD8uZGVzdHJveSgpXG5cdFx0QHdvcmxkID0gbmV3IExheWVyXG5cdFx0XHRuYW1lOiBcIndvcmxkXCJcblx0XHRcdHN1cGVyTGF5ZXI6IEBcblx0XHRcdHNpemU6IGN1YmVTaWRlXG5cdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IG51bGxcblx0XHRcdGNsaXA6IGZhbHNlXG5cdFx0QHdvcmxkLmNlbnRlcigpXG5cblx0XHRAc2lkZXMgPSBbXVxuXHRcdGhhbGZDdWJlU2lkZSA9IEBjdWJlU2lkZSAvIDJcblx0XHRjb2xvcnMgPSBbXCIjODY2Y2NjXCIsIFwiIzI4YWZmYVwiLCBcIiMyZGQ3YWFcIiwgXCIjZmZjMjJjXCIsIFwiIzdkZGQxMVwiLCBcIiNmOTVmYWFcIl1cblx0XHRzaWRlTmFtZXMgPSBbXCJmcm9udFwiLCBcInJpZ2h0XCIsIFwiYmFja1wiLCBcImxlZnRcIiwgXCJ0b3BcIiwgXCJib3R0b21cIl1cblxuXHRcdGZvciBzaWRlSW5kZXggaW4gWzAuLi42XVxuXG5cdFx0XHRyb3RhdGlvblggPSAwXG5cdFx0XHRyb3RhdGlvblggPSAtOTAgaWYgc2lkZUluZGV4IGluIFswLi4uNF1cblx0XHRcdHJvdGF0aW9uWCA9IDE4MCBpZiBzaWRlSW5kZXggaXMgNFxuXG5cdFx0XHRyb3RhdGlvblkgPSAwXG5cdFx0XHRyb3RhdGlvblkgPSBzaWRlSW5kZXggKiAtOTAgaWYgc2lkZUluZGV4IGluIFswLi4uNF1cblxuXHRcdFx0c2lkZSA9IG5ldyBMYXllclxuXHRcdFx0XHRzaXplOiBjdWJlU2lkZVxuXHRcdFx0XHR6OiAtaGFsZkN1YmVTaWRlXG5cdFx0XHRcdG9yaWdpblo6IGhhbGZDdWJlU2lkZVxuXHRcdFx0XHRyb3RhdGlvblg6IHJvdGF0aW9uWFxuXHRcdFx0XHRyb3RhdGlvblk6IHJvdGF0aW9uWVxuXHRcdFx0XHRwYXJlbnQ6IEB3b3JsZFxuXHRcdFx0XHRuYW1lOiBzaWRlTmFtZXNbc2lkZUluZGV4XVxuXHRcdFx0XHRodG1sOiBzaWRlTmFtZXNbc2lkZUluZGV4XVxuXHRcdFx0XHRjb2xvcjogXCJ3aGl0ZVwiXG5cdFx0XHRcdGJhY2tncm91bmRDb2xvcjogY29sb3JzW3NpZGVJbmRleF1cblx0XHRcdFx0c3R5bGU6XG5cdFx0XHRcdFx0bGluZUhlaWdodDogXCIje2N1YmVTaWRlfXB4XCJcblx0XHRcdFx0XHR0ZXh0QWxpZ246IFwiY2VudGVyXCJcblx0XHRcdFx0XHRmb250U2l6ZTogXCIje2N1YmVTaWRlIC8gMTB9cHhcIlxuXHRcdFx0XHRcdGZvbnRXZWlnaHQ6IFwiMTAwXCJcblx0XHRcdFx0XHRmb250RmFtaWx5OiBcIkhlbHZldGljYSBOZXVlXCJcblx0XHRcdEBzaWRlcy5wdXNoKHNpZGUpXG5cdFx0XHRzaWRlLl9iYWNrZ3JvdW5kQ29sb3IgPSBzaWRlLmJhY2tncm91bmRDb2xvclxuXG5cdFx0Zm9yIGtleSBvZiBAc2lkZUltYWdlcyB3aGVuIEBzaWRlSW1hZ2VzP1xuXHRcdFx0QHNldEltYWdlIGtleSwgQHNpZGVJbWFnZXNba2V5XVxuXG5cdGhpZGVFbnZpcm9tZW50OiAtPlxuXHRcdGZvciBzaWRlIGluIEBzaWRlc1xuXHRcdFx0c2lkZS5kZXN0cm95KClcblxuXHRsYXllckZyb21GYWNlOiAoZmFjZSkgLT5cblx0XHRyZXR1cm4gdW5sZXNzIEBzaWRlcz9cblx0XHRtYXAgPVxuXHRcdFx0bm9ydGg6IEBzaWRlc1swXVxuXHRcdFx0ZnJvbnQ6IEBzaWRlc1swXVxuXHRcdFx0ZWFzdDogIEBzaWRlc1sxXVxuXHRcdFx0cmlnaHQ6IEBzaWRlc1sxXVxuXHRcdFx0c291dGg6IEBzaWRlc1syXVxuXHRcdFx0YmFjazogIEBzaWRlc1syXVxuXHRcdFx0d2VzdDogIEBzaWRlc1szXVxuXHRcdFx0bGVmdDogIEBzaWRlc1szXVxuXHRcdFx0dG9wOiAgIEBzaWRlc1s0XVxuXHRcdFx0Ym90dG9tOkBzaWRlc1s1XVxuXHRcdHJldHVybiBtYXBbZmFjZV1cblxuXHRzZXRJbWFnZTogKGZhY2UsIGltYWdlUGF0aCkgLT5cblxuXHRcdHRocm93IEVycm9yIFwiVlJDb21wb25lbnQgc2V0SW1hZ2UsIHdyb25nIG5hbWUgZm9yIGZhY2U6IFwiICsgZmFjZSArIFwiLCB2YWxpZCBvcHRpb25zOiBmcm9udCwgcmlnaHQsIGJhY2ssIGxlZnQsIHRvcCwgYm90dG9tLCBub3J0aCwgZWFzdCwgc291dGgsIHdlc3RcIiB1bmxlc3MgZmFjZSBpbiBTSURFU1xuXG5cdFx0QHNpZGVJbWFnZXMgPSB7fSB1bmxlc3MgQHNpZGVJbWFnZXM/XG5cdFx0QHNpZGVJbWFnZXNbZmFjZV0gPSBpbWFnZVBhdGhcblxuXHRcdGxheWVyID0gQGxheWVyRnJvbUZhY2UoZmFjZSlcblxuXHRcdGlmIGltYWdlUGF0aD9cblx0XHRcdGxheWVyPy5odG1sID0gXCJcIlxuXHRcdFx0bGF5ZXI/LmltYWdlID0gaW1hZ2VQYXRoXG5cdFx0ZWxzZVxuXHRcdFx0bGF5ZXI/Lmh0bWwgPSBsYXllcj8ubmFtZVxuXHRcdFx0bGF5ZXI/LmJhY2tncm91bmRDb2xvciA9IGxheWVyPy5fYmFja2dyb3VuZENvbG9yXG5cblx0Z2V0SW1hZ2U6IChmYWNlKSAtPlxuXG5cdFx0dGhyb3cgRXJyb3IgXCJWUkNvbXBvbmVudCBnZXRJbWFnZSwgd3JvbmcgbmFtZSBmb3IgZmFjZTogXCIgKyBmYWNlICsgXCIsIHZhbGlkIG9wdGlvbnM6IGZyb250LCByaWdodCwgYmFjaywgbGVmdCwgdG9wLCBib3R0b20sIG5vcnRoLCBlYXN0LCBzb3V0aCwgd2VzdFwiIHVubGVzcyBmYWNlIGluIFNJREVTXG5cblx0XHRsYXllciA9IEBsYXllckZyb21GYWNlKGZhY2UpXG5cdFx0cmV0dXJuIGxheWVyLmltYWdlIGlmIGxheWVyP1xuXG5cdHByb2plY3RMYXllcjogKGluc2VydExheWVyKSAtPlxuXG5cdFx0aGVhZGluZyA9IGluc2VydExheWVyLmhlYWRpbmdcblx0XHRoZWFkaW5nID0gMCB1bmxlc3MgaGVhZGluZz9cblxuXHRcdGlmIGhlYWRpbmcgPj0gMzYwXG5cdFx0XHRoZWFkaW5nID0gdmFsdWUgJSAzNjBcblx0XHRlbHNlIGlmIGhlYWRpbmcgPCAwXG5cdFx0XHRyZXN0ID0gTWF0aC5hYnMoaGVhZGluZykgJSAzNjBcblx0XHRcdGhlYWRpbmcgPSAzNjAgLSByZXN0XG5cblx0XHRlbGV2YXRpb24gPSBpbnNlcnRMYXllci5lbGV2YXRpb25cblx0XHRlbGV2YXRpb24gPSAwIHVubGVzcyBlbGV2YXRpb24/XG5cdFx0ZWxldmF0aW9uID0gVXRpbHMuY2xhbXAoZWxldmF0aW9uLCAtOTAsIDkwKVxuXG5cdFx0ZGlzdGFuY2UgPSBpbnNlcnRMYXllci5kaXN0YW5jZVxuXHRcdGRpc3RhbmNlID0gNjAwIHVubGVzcyBkaXN0YW5jZT9cblxuXHRcdGluc2VydExheWVyLmhlYWRpbmcgPSBoZWFkaW5nXG5cdFx0aW5zZXJ0TGF5ZXIuZWxldmF0aW9uID0gZWxldmF0aW9uXG5cdFx0aW5zZXJ0TGF5ZXIuZGlzdGFuY2UgPSBkaXN0YW5jZVxuXG5cdFx0YW5jaG9yID0gbmV3IFZSQW5jaG9yTGF5ZXIoaW5zZXJ0TGF5ZXIsIEBjdWJlU2lkZSlcblx0XHRhbmNob3Iuc3VwZXJMYXllciA9IEB3b3JsZFxuXG5cdFx0QGxvb2tBdChoZWFkaW5nLCBlbGV2YXRpb24pIGlmIEBsb29rQXRMYXRlc3RQcm9qZWN0ZWRMYXllclxuXG5cdCMgTW9iaWxlIGRldmljZSBvcmllbnRhdGlvblxuXG5cdGRldmljZU9yaWVudGF0aW9uVXBkYXRlOiA9PlxuXG5cdFx0aWYgVXRpbHMuaXNEZXNrdG9wKClcblx0XHRcdGlmIEBhcnJvd0tleXNcblx0XHRcdFx0aWYgQF9sYXN0Q2FsbEhvcml6b250YWwgaXMgdW5kZWZpbmVkXG5cdFx0XHRcdFx0QF9sYXN0Q2FsbEhvcml6b250YWwgPSAwXG5cdFx0XHRcdFx0QF9sYXN0Q2FsbFZlcnRpY2FsID0gMFxuXHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uSG9yaXpvbnRhbCA9IDFcblx0XHRcdFx0XHRAX2FjY2VsZXJhdGlvblZlcnRpY2FsID0gMVxuXHRcdFx0XHRcdEBfZ29pbmdVcCA9IGZhbHNlXG5cdFx0XHRcdFx0QF9nb2luZ0xlZnQgPSBmYWxzZVxuXG5cdFx0XHRcdGRhdGUgPSBuZXcgRGF0ZSgpXG5cdFx0XHRcdHggPSAuMVxuXHRcdFx0XHRpZiBLRVlTRE9XTi51cCBvciBLRVlTRE9XTi5kb3duXG5cdFx0XHRcdFx0ZGlmZiA9IGRhdGUgLSBAX2xhc3RDYWxsVmVydGljYWxcblx0XHRcdFx0XHRpZiBkaWZmIDwgMzBcblx0XHRcdFx0XHRcdGlmIEBfYWNjZWxlcmF0aW9uVmVydGljYWwgPCAzMFxuXHRcdFx0XHRcdFx0XHRAX2FjY2VsZXJhdGlvblZlcnRpY2FsICs9IDAuMThcblx0XHRcdFx0XHRpZiBLRVlTRE9XTi51cFxuXHRcdFx0XHRcdFx0aWYgQF9nb2luZ1VwIGlzIGZhbHNlXG5cdFx0XHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uVmVydGljYWwgPSAxXG5cdFx0XHRcdFx0XHRcdEBfZ29pbmdVcCA9IHRydWVcblx0XHRcdFx0XHRcdEBkZXNrdG9wUGFuKDAsIDEgKiBAX2FjY2VsZXJhdGlvblZlcnRpY2FsICogeClcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRpZiBAX2dvaW5nVXAgaXMgdHJ1ZVxuXHRcdFx0XHRcdFx0XHRAX2FjY2VsZXJhdGlvblZlcnRpY2FsID0gMVxuXHRcdFx0XHRcdFx0XHRAX2dvaW5nVXAgPSBmYWxzZVxuXG5cdFx0XHRcdFx0XHRAZGVza3RvcFBhbigwLCAtMSAqIEBfYWNjZWxlcmF0aW9uVmVydGljYWwgKiB4KVxuXHRcdFx0XHRcdEBfbGFzdENhbGxWZXJ0aWNhbCA9IGRhdGVcblxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0QF9hY2NlbGVyYXRpb25WZXJ0aWNhbCA9IDFcblxuXHRcdFx0XHRpZiBLRVlTRE9XTi5sZWZ0IG9yIEtFWVNET1dOLnJpZ2h0XG5cdFx0XHRcdFx0ZGlmZiA9IGRhdGUgLSBAX2xhc3RDYWxsSG9yaXpvbnRhbFxuXHRcdFx0XHRcdGlmIGRpZmYgPCAzMFxuXHRcdFx0XHRcdFx0aWYgQF9hY2NlbGVyYXRpb25Ib3Jpem9udGFsIDwgMjVcblx0XHRcdFx0XHRcdFx0QF9hY2NlbGVyYXRpb25Ib3Jpem9udGFsICs9IDAuMThcblx0XHRcdFx0XHRpZiBLRVlTRE9XTi5sZWZ0XG5cdFx0XHRcdFx0XHRpZiBAX2dvaW5nTGVmdCBpcyBmYWxzZVxuXHRcdFx0XHRcdFx0XHRAX2FjY2VsZXJhdGlvbkhvcml6b250YWwgPSAxXG5cdFx0XHRcdFx0XHRcdEBfZ29pbmdMZWZ0ID0gdHJ1ZVxuXHRcdFx0XHRcdFx0QGRlc2t0b3BQYW4oMSAqIEBfYWNjZWxlcmF0aW9uSG9yaXpvbnRhbCAqIHgsIDApXG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0aWYgQF9nb2luZ0xlZnQgaXMgdHJ1ZVxuXHRcdFx0XHRcdFx0XHRAX2FjY2VsZXJhdGlvbkhvcml6b250YWwgPSAxXG5cdFx0XHRcdFx0XHRcdEBfZ29pbmdMZWZ0ID0gZmFsc2Vcblx0XHRcdFx0XHRcdEBkZXNrdG9wUGFuKC0xICogQF9hY2NlbGVyYXRpb25Ib3Jpem9udGFsICogeCwgMClcblx0XHRcdFx0XHRAX2xhc3RDYWxsSG9yaXpvbnRhbCA9IGRhdGVcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdEBfYWNjZWxlcmF0aW9uSG9yaXpvbnRhbCA9IDFcblxuXHRcdGVsc2UgaWYgQG9yaWVudGF0aW9uRGF0YT9cblxuXHRcdFx0YWxwaGEgPSBAb3JpZW50YXRpb25EYXRhLmFscGhhXG5cdFx0XHRiZXRhID0gQG9yaWVudGF0aW9uRGF0YS5iZXRhXG5cdFx0XHRnYW1tYSA9IEBvcmllbnRhdGlvbkRhdGEuZ2FtbWFcblxuXHRcdFx0QGRpcmVjdGlvblBhcmFtcyhhbHBoYSwgYmV0YSwgZ2FtbWEpIGlmIGFscGhhIGlzbnQgMCBhbmQgYmV0YSBpc250IDAgYW5kIGdhbW1hIGlzbnQgMFxuXG5cdFx0XHR4QW5nbGUgPSBiZXRhXG5cdFx0XHR5QW5nbGUgPSAtZ2FtbWFcblx0XHRcdHpBbmdsZSA9IGFscGhhXG5cblx0XHRcdGhhbGZDdWJlU2lkZSA9IEBjdWJlU2lkZS8yXG5cdFx0XHRvcmllbnRhdGlvbiA9IFwicm90YXRlKCN7d2luZG93Lm9yaWVudGF0aW9uICogLTF9ZGVnKSBcIlxuXHRcdFx0dHJhbnNsYXRpb25YID0gXCJ0cmFuc2xhdGVYKCN7KChAd2lkdGggLyAyKSAtIGhhbGZDdWJlU2lkZSkgKiBGcmFtZXIuQ3VycmVudENvbnRleHQucGl4ZWxNdWx0aXBsaWVyfXB4KVwiXG5cdFx0XHR0cmFuc2xhdGlvblkgPSBcIiB0cmFuc2xhdGVZKCN7KChAaGVpZ2h0IC8gMikgLSBoYWxmQ3ViZVNpZGUpICogRnJhbWVyLkN1cnJlbnRDb250ZXh0LnBpeGVsTXVsdGlwbGllcn1weClcIlxuXHRcdFx0dHJhbnNsYXRpb25aID0gXCIgdHJhbnNsYXRlWigje0BwZXJzcGVjdGl2ZSAqIEZyYW1lci5DdXJyZW50Q29udGV4dC5waXhlbE11bHRpcGxpZXJ9cHgpXCJcblx0XHRcdHJvdGF0aW9uID0gdHJhbnNsYXRpb25aICsgdHJhbnNsYXRpb25YICsgdHJhbnNsYXRpb25ZICsgb3JpZW50YXRpb24gKyBcIiByb3RhdGVZKCN7eUFuZ2xlfWRlZykgcm90YXRlWCgje3hBbmdsZX1kZWcpIHJvdGF0ZVooI3t6QW5nbGV9ZGVnKVwiICsgXCIgcm90YXRlWigjey1AX2hlYWRpbmdPZmZzZXR9ZGVnKVwiXG5cdFx0XHRAd29ybGQuc3R5bGVbXCJ3ZWJraXRUcmFuc2Zvcm1cIl0gPSByb3RhdGlvblxuXG5cdGRpcmVjdGlvblBhcmFtczogKGFscGhhLCBiZXRhLCBnYW1tYSkgLT5cblxuXHRcdGFscGhhUmFkID0gYWxwaGEgKiBAZGVnVG9SYWRcblx0XHRiZXRhUmFkID0gYmV0YSAqIEBkZWdUb1JhZFxuXHRcdGdhbW1hUmFkID0gZ2FtbWEgKiBAZGVnVG9SYWRcblxuXHRcdCMgQ2FsY3VsYXRlIGVxdWF0aW9uIGNvbXBvbmVudHNcblx0XHRjQSA9IE1hdGguY29zKGFscGhhUmFkKVxuXHRcdHNBID0gTWF0aC5zaW4oYWxwaGFSYWQpXG5cdFx0Y0IgPSBNYXRoLmNvcyhiZXRhUmFkKVxuXHRcdHNCID0gTWF0aC5zaW4oYmV0YVJhZClcblx0XHRjRyA9IE1hdGguY29zKGdhbW1hUmFkKVxuXHRcdHNHID0gTWF0aC5zaW4oZ2FtbWFSYWQpXG5cblx0XHQjIHggdW5pdHZlY3RvclxuXHRcdHhyQSA9IC1zQSAqIHNCICogc0cgKyBjQSAqIGNHXG5cdFx0eHJCID0gY0EgKiBzQiAqIHNHICsgc0EgKiBjR1xuXHRcdHhyQyA9IGNCICogc0dcblxuXHRcdCMgeSB1bml0dmVjdG9yXG5cdFx0eXJBID0gLXNBICogY0Jcblx0XHR5ckIgPSBjQSAqIGNCXG5cdFx0eXJDID0gLXNCXG5cblx0XHQjIC16IHVuaXR2ZWN0b3Jcblx0XHR6ckEgPSAtc0EgKiBzQiAqIGNHIC0gY0EgKiBzR1xuXHRcdHpyQiA9IGNBICogc0IgKiBjRyAtIHNBICogc0dcblx0XHR6ckMgPSBjQiAqIGNHXG5cblx0XHQjIENhbGN1bGF0ZSBoZWFkaW5nXG5cdFx0aGVhZGluZyA9IE1hdGguYXRhbih6ckEgLyB6ckIpXG5cblx0XHQjIENvbnZlcnQgZnJvbSBoYWxmIHVuaXQgY2lyY2xlIHRvIHdob2xlIHVuaXQgY2lyY2xlXG5cdFx0aWYgenJCIDwgMFxuXHRcdFx0aGVhZGluZyArPSBNYXRoLlBJXG5cdFx0ZWxzZSBpZiB6ckEgPCAwXG5cdFx0XHRoZWFkaW5nICs9IDIgKiBNYXRoLlBJXG5cblx0XHQjICMgQ2FsY3VsYXRlIEFsdGl0dWRlIChpbiBkZWdyZWVzKVxuXHRcdGVsZXZhdGlvbiA9IE1hdGguUEkgLyAyIC0gTWF0aC5hY29zKC16ckMpXG5cblx0XHRjSCA9IE1hdGguc3FydCgxIC0gKHpyQyAqIHpyQykpXG5cdFx0dGlsdCA9IE1hdGguYWNvcygteHJDIC8gY0gpICogTWF0aC5zaWduKHlyQylcblxuXHRcdCMgQ29udmVydCByYWRpYW5zIHRvIGRlZ3JlZXNcblx0XHRoZWFkaW5nICo9IDE4MCAvIE1hdGguUElcblx0XHRlbGV2YXRpb24gKj0gMTgwIC8gTWF0aC5QSVxuXHRcdHRpbHQgKj0gMTgwIC8gTWF0aC5QSVxuXG5cdFx0QF9oZWFkaW5nID0gTWF0aC5yb3VuZChoZWFkaW5nICogMTAwMCkgLyAxMDAwXG5cdFx0QF9lbGV2YXRpb24gPSBNYXRoLnJvdW5kKGVsZXZhdGlvbiAqIDEwMDApIC8gMTAwMFxuXG5cdFx0dGlsdCA9IE1hdGgucm91bmQodGlsdCAqIDEwMDApIC8gMTAwMFxuXHRcdG9yaWVudGF0aW9uVGlsdE9mZnNldCA9ICh3aW5kb3cub3JpZW50YXRpb24gKiAtMSkgKyA5MFxuXHRcdHRpbHQgKz0gb3JpZW50YXRpb25UaWx0T2Zmc2V0XG5cdFx0dGlsdCAtPSAzNjAgaWYgdGlsdCA+IDE4MFxuXHRcdEBfdGlsdCA9IHRpbHRcblxuXHRcdEBfZGV2aWNlSGVhZGluZyA9IEBfaGVhZGluZ1xuXHRcdEBfZGV2aWNlRWxldmF0aW9uID0gQF9lbGV2YXRpb25cblx0XHRAX2VtaXRPcmllbnRhdGlvbkRpZENoYW5nZUV2ZW50KClcblxuXHQjIFBhbm5pbmdcblxuXHRfY2FudmFzVG9Db21wb25lbnRSYXRpbzogPT5cblx0XHRwb2ludEEgPSBVdGlscy5jb252ZXJ0UG9pbnRGcm9tQ29udGV4dCh7eDowLCB5OjB9LCBALCB0cnVlKVxuXHRcdHBvaW50QiA9IFV0aWxzLmNvbnZlcnRQb2ludEZyb21Db250ZXh0KHt4OjEsIHk6MX0sIEAsIHRydWUpXG5cdFx0eERpc3QgPSBNYXRoLmFicyhwb2ludEEueCAtIHBvaW50Qi54KVxuXHRcdHlEaXN0ID0gTWF0aC5hYnMocG9pbnRBLnkgLSBwb2ludEIueSlcblx0XHRyZXR1cm4ge3g6eERpc3QsIHk6eURpc3R9XG5cblx0c2V0dXBQYW46IChlbmFibGVkKSA9PlxuXG5cdFx0QHBhbm5pbmcgPSBlbmFibGVkXG5cdFx0QGRlc2t0b3BQYW4oMCwgMClcblxuXHRcdEBvbk1vdXNlRG93biA9PiBAYW5pbWF0ZVN0b3AoKVxuXG5cdFx0QG9uUGFuIChkYXRhKSA9PlxuXHRcdFx0cmV0dXJuIGlmIG5vdCBAcGFubmluZ1xuXHRcdFx0cmF0aW8gPSBAX2NhbnZhc1RvQ29tcG9uZW50UmF0aW8oKVxuXHRcdFx0ZGVsdGFYID0gZGF0YS5kZWx0YVggKiByYXRpby54XG5cdFx0XHRkZWx0YVkgPSBkYXRhLmRlbHRhWSAqIHJhdGlvLnlcblx0XHRcdHN0cmVuZ3RoID0gVXRpbHMubW9kdWxhdGUoQHBlcnNwZWN0aXZlLCBbMTIwMCwgOTAwXSwgWzIyLCAxNy41XSlcblxuXHRcdFx0aWYgVXRpbHMuaXNNb2JpbGUoKVxuXHRcdFx0XHRAX2hlYWRpbmdPZmZzZXQgLT0gKGRlbHRhWCAvIHN0cmVuZ3RoKSBpZiBAbW9iaWxlUGFubmluZ1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRAZGVza3RvcFBhbihkZWx0YVggLyBzdHJlbmd0aCwgZGVsdGFZIC8gc3RyZW5ndGgpXG5cblx0XHRcdEBfcHJldlZlbG9YID0gZGF0YS52ZWxvY2l0eVhcblx0XHRcdEBfcHJldlZlbG9VID0gZGF0YS52ZWxvY2l0eVlcblxuXHRcdEBvblBhbkVuZCAoZGF0YSkgPT5cblx0XHRcdHJldHVybiBpZiBub3QgQHBhbm5pbmcgb3IgVXRpbHMuaXNNb2JpbGUoKVxuXHRcdFx0cmF0aW8gPSBAX2NhbnZhc1RvQ29tcG9uZW50UmF0aW8oKVxuXHRcdFx0dmVsb2NpdHlYID0gKGRhdGEudmVsb2NpdHlYICsgQF9wcmV2VmVsb1gpICogMC41XG5cdFx0XHR2ZWxvY2l0eVkgPSAoZGF0YS52ZWxvY2l0eVkgKyBAX3ByZXZWZWxvWSkgKiAwLjVcblx0XHRcdHZlbG9jaXR5WCAqPSB2ZWxvY2l0eVhcblx0XHRcdHZlbG9jaXR5WSAqPSB2ZWxvY2l0eVlcblx0XHRcdHZlbG9jaXR5WCAqPSByYXRpby54XG5cdFx0XHR2ZWxvY2l0eVkgKj0gcmF0aW8ueVxuXHRcdFx0c3RyZW5ndGggPSBVdGlscy5tb2R1bGF0ZShAcGVyc3BlY3RpdmUsIFsxMjAwLCA5MDBdLCBbMjIsIDE3LjVdKVxuXG5cdFx0XHRAYW5pbWF0ZVxuXHRcdFx0XHRoZWFkaW5nOiBAaGVhZGluZyAtIChkYXRhLnZlbG9jaXR5WCAqIHJhdGlvLnggKiAyMDApIC8gc3RyZW5ndGhcblx0XHRcdFx0ZWxldmF0aW9uOiBAZWxldmF0aW9uICsgKGRhdGEudmVsb2NpdHlZICogcmF0aW8ueSAqIDIwMCkgLyBzdHJlbmd0aFxuXHRcdFx0XHRvcHRpb25zOiBjdXJ2ZTogXCJzcHJpbmcoMzAwLDEwMClcIlxuXG5cdGRlc2t0b3BQYW46IChkZWx0YURpciwgZGVsdGFIZWlnaHQpIC0+XG5cdFx0aGFsZkN1YmVTaWRlID0gQGN1YmVTaWRlLzJcblx0XHR0cmFuc2xhdGlvblggPSBcInRyYW5zbGF0ZVgoI3soKEB3aWR0aCAvIDIpIC0gaGFsZkN1YmVTaWRlKSAqIEZyYW1lci5DdXJyZW50Q29udGV4dC5waXhlbE11bHRpcGxpZXJ9cHgpXCJcblx0XHR0cmFuc2xhdGlvblkgPSBcIiB0cmFuc2xhdGVZKCN7KChAaGVpZ2h0IC8gMikgLSBoYWxmQ3ViZVNpZGUpICogRnJhbWVyLkN1cnJlbnRDb250ZXh0LnBpeGVsTXVsdGlwbGllcn1weClcIlxuXHRcdHRyYW5zbGF0aW9uWiA9IFwiIHRyYW5zbGF0ZVooI3tAcGVyc3BlY3RpdmUgKiBGcmFtZXIuQ3VycmVudENvbnRleHQucGl4ZWxNdWx0aXBsaWVyfXB4KVwiXG5cdFx0QF9oZWFkaW5nIC09IGRlbHRhRGlyXG5cblx0XHRpZiBAX2hlYWRpbmcgPiAzNjBcblx0XHRcdEBfaGVhZGluZyAtPSAzNjBcblx0XHRlbHNlIGlmIEBfaGVhZGluZyA8IDBcblx0XHRcdEBfaGVhZGluZyArPSAzNjBcblxuXHRcdEBfZWxldmF0aW9uICs9IGRlbHRhSGVpZ2h0XG5cdFx0QF9lbGV2YXRpb24gPSBVdGlscy5jbGFtcChAX2VsZXZhdGlvbiwgLTkwLCA5MClcblxuXHRcdHJvdGF0aW9uID0gdHJhbnNsYXRpb25aICsgdHJhbnNsYXRpb25YICsgdHJhbnNsYXRpb25ZICsgXCIgcm90YXRlWCgje0BfZWxldmF0aW9uICsgOTB9ZGVnKSByb3RhdGVaKCN7MzYwIC0gQF9oZWFkaW5nfWRlZylcIiArIFwiIHJvdGF0ZVooI3stQF9oZWFkaW5nT2Zmc2V0fWRlZylcIlxuXHRcdEB3b3JsZC5zdHlsZVtcIndlYmtpdFRyYW5zZm9ybVwiXSA9IHJvdGF0aW9uXG5cblx0XHRAX2VtaXRPcmllbnRhdGlvbkRpZENoYW5nZUV2ZW50KClcblxuXHRsb29rQXQ6IChoZWFkaW5nLCBlbGV2YXRpb24pIC0+XG5cdFx0aGFsZkN1YmVTaWRlID0gQGN1YmVTaWRlLzJcblx0XHR0cmFuc2xhdGlvblggPSBcInRyYW5zbGF0ZVgoI3soKEB3aWR0aCAvIDIpIC0gaGFsZkN1YmVTaWRlKSAqIEZyYW1lci5DdXJyZW50Q29udGV4dC5waXhlbE11bHRpcGxpZXJ9cHgpXCJcblx0XHR0cmFuc2xhdGlvblkgPSBcIiB0cmFuc2xhdGVZKCN7KChAaGVpZ2h0IC8gMikgLSBoYWxmQ3ViZVNpZGUpICogRnJhbWVyLkN1cnJlbnRDb250ZXh0LnBpeGVsTXVsdGlwbGllcn1weClcIlxuXHRcdHRyYW5zbGF0aW9uWiA9IFwiIHRyYW5zbGF0ZVooI3tAcGVyc3BlY3RpdmUgKiBGcmFtZXIuQ3VycmVudENvbnRleHQucGl4ZWxNdWx0aXBsaWVyfXB4KVwiXG5cdFx0cm90YXRpb24gPSB0cmFuc2xhdGlvblogKyB0cmFuc2xhdGlvblggKyB0cmFuc2xhdGlvblkgKyBcIiByb3RhdGVaKCN7QF90aWx0fWRlZykgcm90YXRlWCgje2VsZXZhdGlvbiArIDkwfWRlZykgcm90YXRlWigjey1oZWFkaW5nfWRlZylcIlxuXG5cdFx0QHdvcmxkPy5zdHlsZVtcIndlYmtpdFRyYW5zZm9ybVwiXSA9IHJvdGF0aW9uXG5cdFx0QF9oZWFkaW5nID0gaGVhZGluZ1xuXHRcdEBfZWxldmF0aW9uID0gZWxldmF0aW9uXG5cdFx0QF9oZWFkaW5nT2Zmc2V0ID0gQF9oZWFkaW5nIC0gQF9kZXZpY2VIZWFkaW5nIGlmIFV0aWxzLmlzTW9iaWxlKClcblx0XHRAX2VsZXZhdGlvbk9mZnNldCA9IEBfZWxldmF0aW9uIC0gQF9kZXZpY2VFbGV2YXRpb25cblxuXHRcdGhlYWRpbmcgPSBAX2hlYWRpbmdcblx0XHRpZiBoZWFkaW5nIDwgMFxuXHRcdFx0aGVhZGluZyArPSAzNjBcblx0XHRlbHNlIGlmIGhlYWRpbmcgPiAzNjBcblx0XHRcdGhlYWRpbmcgLT0gMzYwXG5cblx0XHRAX2VtaXRPcmllbnRhdGlvbkRpZENoYW5nZUV2ZW50KClcblxuXHRfZW1pdE9yaWVudGF0aW9uRGlkQ2hhbmdlRXZlbnQ6ID0+XG5cdFx0QGVtaXQoRXZlbnRzLk9yaWVudGF0aW9uRGlkQ2hhbmdlLCB7aGVhZGluZzogQGhlYWRpbmcsIGVsZXZhdGlvbjogQGVsZXZhdGlvbiwgdGlsdDogQHRpbHR9KVxuXG5cdCMgZXZlbnQgc2hvcnRjdXRzXG5cblx0b25PcmllbnRhdGlvbkNoYW5nZTooY2IpIC0+IEBvbihFdmVudHMuT3JpZW50YXRpb25EaWRDaGFuZ2UsIGNiKVxuIiwiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiXSwibmFtZXMiOltd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
