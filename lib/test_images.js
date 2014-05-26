'use strict';

var async = require('async');
var path = require('path');
var glob = require('glob');
var ld = require('lodash');
var util = require('util');
var events = require("events");

var ImageTest = require('./image_test');

function TestImages(settings) {
  this.settings = settings;
  this.paths = {
    baselinesDir: this.settings.baselinesDir,
    samplesDir: this.settings.samplesDir,
    diffsDir: this.settings.diffsDir
  };
  ld.bindAll(this, ['run', 'getBaselineName', 'testBaselines', 'testBaseline', 'emitTestSize', 'emitTestCompleted']);
  this.targetLookup = ld.object(ld.pluck(this.settings.targets,"fileName"), this.settings.targets);
}
util.inherits(TestImages, events.EventEmitter);

TestImages.prototype.run = function (cb) {
  async.waterfall([
    this.getBaselineName,
    this.testBaselines
  ], function (err, results) {
    if (err) {
      return cb(err);
    } else {
      return cb(null, results);
    }
  });
};

TestImages.prototype.getBaselineName = function (cb) {
  glob(path.join(this.settings.baselinesDir, this.settings.imagePattern), function (err, files) {
    if (err) {
      cb(err);
    } else {
      cb(null, ld.shuffle(files));
    }
  });
};

TestImages.prototype.testBaselines = function (files, cb) {
  this.emitTestSize(ld.size(files));
  async.map(files, this.testBaseline, cb);
};

TestImages.prototype.testBaseline = function (imgPath, cb) {
  var fileName = path.basename(imgPath);
  var test = new ImageTest(fileName, this.paths, this.targetLookup[fileName]);
  test.perform(function (err, testResult) {
    this.emitTestCompleted(testResult);
    cb(err, testResult);
  }.bind(this));
};

TestImages.prototype.emitTestSize = function (size) {
  this.emit("start", { size: size, title: "Comparing Images: " });
};

TestImages.prototype.emitTestCompleted = function (result) {
  this.emit("tick", { name: result.imageName });
};

module.exports = TestImages;
