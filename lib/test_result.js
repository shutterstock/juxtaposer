'use strict';

var ld = require('lodash');

var isSkipped = function (data) {
  return !data.exists;
};

var isFailed = function (data) {
  return data.exists && !data.matches;
};

var isSuccess = function (data) {
  return data.matches;
};

var getState = function (obj) {
  if (obj.isSkipped) { return "skipped"; }
  if (obj.isFailed)  { return "failed"; }
  if (obj.isSuccess) { return "success"; }
  throw new Error("impossible state");
};

var prettifyName =  function (imageName) {
  return imageName.replace(/_/g, ' ').replace(/.png$/, '');
};

function TestResult (data) {
  var paths = ld.pick(data, ["baselinePath", "samplePath", "diffsPath"]);
  var deltas = ld.pick(data, ["compositeImage", "changesImage", "animateImage"]);
  ld.assign(this, paths, deltas);
  this.imageName = data.imageName;

  this.isSkipped = isSkipped(data);
  this.isFailed = isFailed(data);
  this.isSuccess = isSuccess(data);
  this.state = getState(this);
  this.prettyName = prettifyName(this.imageName);
}

module.exports = TestResult;
