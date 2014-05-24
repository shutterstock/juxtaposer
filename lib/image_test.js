'use strict;'

var async = require('async');
var fs = require('fs');
var path = require('path');
var ld = require('lodash');
var exec = require('child_process').exec;
var TestResult = require('./test_result')
var DifferenceViews = require('./difference_views')
var G$ = require('./global_helpers')

function ImageTest(imageName, paths, target) {
  this.imageName    = imageName
  this.baselinePath = path.join(paths.baselinesDir, this.imageName);
  this.samplePath   = path.join(paths.samplesDir, this.imageName);
  this.diffsPath    = path.join(paths.diffsDir, this.imageName);
  this.target       = target;

  this.diffViewBuilder = new DifferenceViews( ld.pick(this, G$.w("imageName baselinePath samplePath diffsPath")));

  ld.bindAll(this, ['perform', 'sampleExists', 'imagesMatch',
                    'resizeSample', 'getSampleSize',
                    'getBaselineSize', 'compositeImage',
                    'clearExcludeRegions',
                    'changesImage', 'animateImage'])
}

ImageTest.prototype.perform = function (cb) {
  async.auto({
    exists:       this.sampleExists,
    baseSize:     this.getBaselineSize,
    sampleSize:   [ 'exists', this.getSampleSize],
    clearExcludeRegions: ['sampleSize', 'baseSize', this.clearExcludeRegions],
    resizeSample: [ 'clearExcludeRegions', this.resizeSample],
    matches:      [ 'resizeSample', this.imagesMatch],
    compositeImage: [ 'matches', this.compositeImage],
    changesImage:   [ 'matches', this.changesImage],
    animateImage:   [ 'matches', this.animateImage]
  }, function (err, results) {
    ld.assign(results,ld.pick(this, G$.w("imageName baselinePath samplePath diffsPath")));
    cb(err, new TestResult(results));
  }.bind(this));
};

ImageTest.prototype.sampleExists = function (cb) {
  fs.exists(this.samplePath, function (exists) {
    cb(null, exists);
  })
};

//convert input.jpg -strokewidth 0 -fill "rgba( 255, 215, 0 , 0.5 )" -draw "rectangle 66,50 200,150 " output.jpg
ImageTest.prototype.clearExcludeRegions = function (cb, results) {
  if (!results.baseSize || !results.sampleSize) { return cb(); }
  if (ld.isEmpty(this.target.excludeRegions)) { return cb(); }

  this.target.excludeRegions = ld.pull(this.target.excludeRegions, null)
  rectangleData = ld.map(this.target.excludeRegions, function (reg) {
    return '-draw "rectangle '+reg.left+','+reg.top+' '+reg.right+','+reg.bottom+' "'
  })

  async.each([this.baselinePath, this.samplePath], function (filePath, callback) {
    var command = ['convert' , filePath, '-strokewidth 0', '-fill "rgb(255,0,255)"', rectangleData, filePath]
    command = ld.flatten(command).join(" ")
    exec(command, function (err, stdout, stderr) {
      if (ld.isEmpty(stderr)) { err = null; }
      callback(err);
    });
  }, cb);

}

ImageTest.prototype.imagesMatch = function (cb, results) {
  if (!results.exists) { return cb(null, false); } //missing image guard

  var fuzzAmount = this.target.fuzz || "0"
  var command = [ 'compare ', this.baselinePath, this.samplePath,
                 '-metric AE', '-fuzz '+fuzzAmount+'%', '-highlight-color "#1693A7" ',
                 '-compose Src ', this.diffsPath].join(' ');

  exec(command, function (err, stdout, stderr) {
    if (stderr) { stderr = stderr.trim(); }
    if (/^\d+$/.test(stderr)) {
      var result = parseInt(stderr);
      cb(null, result === 0 );
    } else if (/^\d+$/.test(stdout)){
      var result = parseInt(stdout);
      cb(null, result === 0 );
    } else {
      console.log()
      console.log(this.imageName.red);
      console.log(stderr.red)
      console.log()
      cb(null,false);
    }
  }.bind(this));
};

ImageTest.prototype.compositeImage = function (cb, results) {
  if (results.matches || !results.exists) { return cb(null, false); } //missing image guard
  this.diffViewBuilder.invertedView(cb)
};

ImageTest.prototype.changesImage = function (cb, results) {
  if (results.matches || !results.exists) { return cb(null, false); } //missing image guard
  this.diffViewBuilder.changesOverlay(cb)
};

ImageTest.prototype.animateImage = function (cb, results) {
  if (results.matches || !results.exists) { return cb(null, false); } //missing image guard
  this.diffViewBuilder.animatedView(cb)
};

ImageTest.prototype.getBaselineSize = function (cb) {
  var command = [ 'identify ', this.baselinePath].join(' ');

  exec(command, function (err, stdout, stderr) {
    var size = ld.find(stdout.split(' '), function (data) { return /\d+x\d+/.test(data)})
    cb(null, size);
  }.bind(this));
};

ImageTest.prototype.getSampleSize = function (cb, results) {
  if (!results.exists) { return cb(null, false); } //missing image guard

  var command = [ 'identify ', this.samplePath ].join(' ');
  exec(command, function (err, stdout, stderr) {
    var size = ld.find(stdout.split(' '), function (data) { return /x/.test(data)})
    cb(null, size);
  }.bind(this));
};

ImageTest.prototype.resizeSample = function (cb, results) {
  if (!results.exists) { return cb(null, false); } //missing image guard
  if (results.baseSize === results.sampleSize) { return cb(null, false); } //same size image guard

  var command = [ 'convert ', this.samplePath,
                  '-background none',
                  '-extent ', results.baseSize,
                  this.samplePath ].join(' ');
  exec(command, function (err, stdout, stderr) {
    if (err) { console.log("\ncommand: ", command, "\nresize: ",this)}
    cb(err);
  }.bind(this));
};

module.exports = ImageTest;
