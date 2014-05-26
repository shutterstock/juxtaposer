'use strict';

var ld   = require('lodash');
var path = require('path');
var swig = require('swig');
var G$   = require('./global_helpers');

function Target (data) {
  this.url = data.url;
  this.fileName = data.name || this.buildFileName(data.url);
  this.width = data.width;
  this.height = data.height;
  this.onlyRegion = data.only;
  this.fuzz = data.fuzz;

  this.exclude = (ld.isString(data.exclude)) ? [data.exclude] : data.exclude;
  this.excludeRegions = [];

  ld.bindAll(this, G$.w("buildFileName buildUrl buildPath"));
}

Target.build = function (data) {
  return new Target(data);
};

Target.prototype.buildFileName = function (targetUrl) {
  return 'TODO.png';
};

Target.prototype.buildUrl = function (options) {
  return swig.render(this.url, { locals: options.substitutions });
};

Target.prototype.buildPath = function (options) {
  return path.join(options.dest, this.fileName);
};

module.exports = Target;
