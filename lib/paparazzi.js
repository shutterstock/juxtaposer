'use strict';
var ld     = require('lodash');
var util   = require('util');
var events = require("events");
var async  = require('async');
var G$     = require('./global_helpers');

function Paparazzi (targets, options, settings, pool) {
  this.targets = targets;
  this.options = options;
  this.settings = settings;
  this.pool = pool;

  ld.bindAll(this, G$.w("run emitSize emitImageCaptured"));
}
util.inherits(Paparazzi, events.EventEmitter);

Paparazzi.prototype.run = function (cb) {
  var self = this;
  this.emitSize(this.targets.length);

  async.each(ld.shuffle(this.targets), function (target, callback) {
    self.pool.acquire(function (err, paparazzo) {
      paparazzo.capture(target, self.options, function (err) {
        callback(err);
        self.emitImageCaptured();
        if (err) {
          self.pool.removeBadObject(paparazzo)
        } else {
          self.pool.release(paparazzo);
        }
      });
    })
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
