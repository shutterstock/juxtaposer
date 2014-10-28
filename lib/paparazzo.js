'use strict';

var ld   = require('lodash');
var G$   = require('./global_helpers');
var async   = require('async');
var phantom = require('phantom');
var semlocks = require('semlocks');
var os = require("os");

semlocks.setMaxLocks('phantom', os.cpus().length);


function Paparazzo(options) {
  if (!options) { options = {}; }

  this.phantomOptions = {
    phantomPath: options.phantomPath
  };
  ld.bindAll(this, G$.w('capture setTarget setup navigateToPage storeImage close setPageDimensions setCaptureRegion recordExcludedRegions'));
}

Paparazzo.prototype.setup = function (callback) {
  var self = this;
  if (self.page) { return callback(null, self.page) }
  semlocks.acquire("phantom", { wait: 30000 }, function (err, release) {
    var newCallback = function (e, r) {
      if (release) { release(); }
      callback(e, r);
    };

    if (err) { return newCallback(err); }
    phantom.create(function (pageHelper) {
      self.pageHelper = pageHelper;
      pageHelper.createPage(function (page) {
        self.page = page;
        newCallback(null, page);
      });
    }, self.phantomOptions);
  })
}

Paparazzo.prototype.close = function (callback) {
  if (this.pageHelper) {
    this.pageHelper.exit();
    this.pageHelper = null;
    this.page = null;
  }
  if (callback) { callback(); }
}

Paparazzo.prototype.setTarget = function (target, options) {
  this.target = target;
  this.destination = this.target.buildPath(options); //TODO move up one level
  this.targetUrl = this.target.buildUrl(options);
}

Paparazzo.prototype.capture = function (target, options, callback) {
  this.setTarget(target, options)
  async.series([
    this.setup,
    this.setPageDimensions,
    this.navigateToPage,
    this.setCaptureRegion,
    this.recordExcludedRegions,
    this.storeImage
  ], function (err, results) {
    callback(err);
  }.bind(this));
};

Paparazzo.prototype.setPageDimensions = function (callback) {
  var dimensions = {
    width: this.target.width || 1200,
    height: this.target.height || 800
  };
  this.page.setViewportSize(dimensions.width, dimensions.height, function (err) {
    callback(err);
  });
};

Paparazzo.prototype.navigateToPage = function (callback) {
  this.page.open(this.targetUrl, function (status) {
    var err;
    if (status !== "success") {
      err = "Failed to open " + this.targetUrl
    }
    ld.delay(callback, this.target.delay || 750, err);
  }.bind(this));
};

Paparazzo.prototype.setCaptureRegion = function (callback) {
  if (!this.target.onlyRegion) { return callback(); }

  if (ld.isString(this.target.onlyRegion)) {
    this.page.evaluate(function (s) {
      return document.querySelector(s).getBoundingClientRect();
    },function (err,clipRect) {
      this.page.set('clipRect', clipRect, function (err) {
        callback();
      });
    }.bind(this),this.target.onlyRegion);
  } else {
    var clipRect = ld.object(G$.w("left top width height"), this.target.onlyRegion);
    this.page.set('clipRect', clipRect, function (err) {
      callback();
    });
  }
};

Paparazzo.prototype.recordExcludedRegions = function (callback) {
  if (!this.target.exclude) { return callback(); }
  var self = this;

  async.each(self.target.exclude, function (selector, cb) {
    self.page.evaluate(function (selector) {
      var elements =  document.querySelectorAll(selector);
      var rectangles = [];
      var elemList = [];
      for (var i = 0; i < elements.length; ++i) {
        elemList.push(elements[i]);
      }
      elemList.forEach(function (x) {
        rectangles.push(x.getBoundingClientRect());
      });
      return rectangles;
    },function (err, clipRect) {
      self.target.excludeRegions.push(clipRect);
      cb(err);
    }, selector);
  },function (err) {
    if (err) { return callback(err); }
    self.target.excludeRegions = ld.flatten(self.target.excludeRegions);
    callback();
  });
};

Paparazzo.prototype.storeImage = function (callback) {
  this.page.render(this.destination, function (err) {
    callback(err);
  });
};

module.exports = Paparazzo;
