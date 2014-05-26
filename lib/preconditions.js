'use strict';

var async = require('async');
var fs    = require('fs');
var path  = require('path');
var glob  = require('glob');
var ld    = require('lodash');
var exec  = require('child_process').exec;

var mkdirIfNotExists = function (path, cb) {
  fs.mkdir(path, function (err) {
    if (err && err.code !== 'EEXIST') {
      cb(err);
    } else {
      cb();
    }
  });
};

function Preconditions(settings) {
  this.settings = settings;
  ld.bindAll(this, ['ensureDirectories', 'hasBaselines', 'run', 'hasImageMagick']);
}

Preconditions.prototype.run = function (cb) {
  async.series([
    this.hasImageMagick,
    this.ensureDirectories,
    this.hasBaselines
  ], function (err, results) {
    cb(err);
  });
};

Preconditions.prototype.ensureDirectories = function (cb) {
  var dirs = [this.settings.imagesDir, this.settings.baselinesDir, this.settings.samplesDir, this.settings.diffsDir];
  async.eachSeries(dirs, mkdirIfNotExists, cb);
};

Preconditions.prototype.hasBaselines = function (cb) {
  if (this.isBaselineNeeded) { return cb(); }
  glob(path.join(this.settings.baselinesDir, this.settings.imagePattern), function (err, files) {
    if (err) { return cb(err); }
    this.settings.isBaselineNeeded = this.settings.isBaselineNeeded || ld.isEmpty(files);
    cb();
  }.bind(this));
};

Preconditions.prototype.hasImageMagick = function (cb) {
  exec('which convert', function (err, stdout, stderr) {
    if (err) {
      var message = "ImageMagick is not installed.\nRun:  " + "brew install imagemagick".cyan;
      err = new Error(message);
    }
    cb(err);
  });
};

module.exports = Preconditions;
