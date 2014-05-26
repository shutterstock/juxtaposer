'use strict';

var ld   = require('lodash');
var exec = require('child_process').exec;
var fs   = require('fs');
var G$   = require('./global_helpers');

function DifferenceViews (settings) {
  ld.assign(this, settings);
  ld.bindAll(this, G$.w("invertedView changesOverlay animatedView"));
}

DifferenceViews.prototype.invertedView = function (cb) {
  var resultsPath = this.diffsPath.replace(/png$/, "comp.png");
  var command = ['composite ', this.baselinePath, this.samplePath,
                 '-compose difference', resultsPath].join(' ');
  exec(command, function (err, stdout, stderr) {
    if (ld.isEmpty(stderr)) { err = null; }
    cb(err,resultsPath);
  });
};

DifferenceViews.prototype.changesOverlay = function (cb) {
  var resultsPath = this.diffsPath.replace(/png$/, "changes.png");
  if (!fs.existsSync(this.diffsPath)) { return cb(null, resultsPath); }

  var command = ['composite ', this.diffsPath, this.baselinePath, resultsPath].join(' ');
  exec(command, function (err, stdout, stderr) {
    if (ld.isEmpty(stderr)) { err = null; }
    cb(err, resultsPath);
  });
};

DifferenceViews.prototype.animatedView = function (cb) {
  var resultsPath = this.diffsPath.replace(/png$/, "animated.gif");
  var command = ['convert ', '-delay 100', '-loop 0',
                 this.baselinePath, this.samplePath, resultsPath].join(' ');
  exec(command, function (err, stdout, stderr) {
    if (ld.isEmpty(stderr)) { err = null; }
    cb(err, resultsPath);
  });
};

module.exports = DifferenceViews;
