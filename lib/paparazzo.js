'use strict;'

var ld   = require('lodash')
var path = require('path')
var G$   = require('./global_helpers')

var CaptureImage = require('./capture_image')

function Paparazzo(options, target) {
  this.options = options;
  this.target = target;

  ld.bindAll(this, G$.w("capture "))
}

Paparazzo.prototype.capture = function (callback) {
  var destinationPath = this.target.buildPath(this.options) //TODO move up one level
  var targetUrl = this.target.buildUrl(this.options)
  var captureImage = new CaptureImage(destinationPath, targetUrl, this.target)
  captureImage.run(function (err, results) {
    callback(err, results);
  })
}

module.exports = Paparazzo;
