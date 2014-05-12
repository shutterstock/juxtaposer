'use strict;'
var async = require('async');
var fs = require('fs');
var path = require('path');
var glob = require('glob')
var ld = require('lodash');

function CleanupDirs(settings) {
  this.settings = settings;

  ld.bindAll(this, ['run', 'cleanDir'])
}

CleanupDirs.prototype.run = function (cb) {
  dirs = [this.settings.samplesDir, this.settings.diffsDir];
  if (this.settings.isBaselineNeeded) {
   dirs.push(this.settings.baselinesDir)
  }
  var self = this;
  async.parallel({
    removeImages: function(callback){
      async.each(dirs, self.cleanDir, callback)
    },
    removeHtmls: function (callback) {
      glob(path.join(self.settings.imagesDir, "**/*.html"), function (err, docs){
        if (err) { return callback(err) }
        async.each(docs, fs.unlink, cb);
      })
    }
  }, function (err, results) {
    cb(err)
  })
}

CleanupDirs.prototype.cleanDir = function (targetDir, cb) {
  glob(path.join(targetDir, this.settings.imagePattern), function (err, files) {
    if (err) { return cb(err); }
    glob(path.join(targetDir,"*.gif"), function (err, gifs) {
      if (err) { return cb(err); }
      files = ld.union(files, gifs)
      async.each(files, fs.unlink, cb);
    });
  });
}


module.exports = CleanupDirs;
