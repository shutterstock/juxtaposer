'use strict';
var ld     = require('lodash');
var util   = require('util');
var events = require("events");
var async  = require('async');
var G$     = require('./global_helpers');

var Paparazzo    = require("./paparazzo");
var CaptureImage = require('./capture_image');

function Paparazzi (targets, options, settings) {
  this.targets = targets;
  this.options = options;
  this.settings = settings;

  if (!CaptureImage.phantomPath && this.settings.phantomPath) { CaptureImage.phantomPath = this.settings.phantomPath; }

  ld.bindAll(this, G$.w("run emitSize emitImageCaptured"));
}
util.inherits(Paparazzi, events.EventEmitter);

Paparazzi.prototype.run = function (cb) {
  var self = this;
  this.emitSize(this.targets.length);
  async.eachLimit(ld.shuffle(this.targets), this.settings.maxPhantoms, function (target, callback) {
    var paparazzo = new Paparazzo(self.options, target);
    paparazzo.capture(function (err) {
      callback(err);
      self.emitImageCaptured();
    });
  }, function (err) {
    cb(err);
  });
};

Paparazzi.prototype.emitSize = function (size) {
  this.emit("start", { size: size, title: "Capturing Images: " });
};

Paparazzi.prototype.emitImageCaptured = function () {
  this.emit("tick", {});
};

module.exports = Paparazzi;
