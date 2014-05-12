'use strict;'

var ld = require('lodash')
var fs = require('fs')
var path = require('path')
var Target = require('./target')

function Manifest (settings) {
  this.settings = settings;

  ld.bindAll(this, ['load'])
}

Manifest.prototype.load = function() {
  var rawData = fs.readFileSync(path.resolve(this.settings.cwd, "targets.json") ).toString()
  var data = JSON.parse(rawData)
  var data = ld.map(data, Target.build)
  return data;
}


module.exports = Manifest
