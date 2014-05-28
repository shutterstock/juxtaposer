'use strict';

var ld      = require("lodash");
var async   = require('async');
var phantom = require('node-phantom-versioned');
var G$      = require('./global_helpers');

var CaptureImage = function (destination, targetUrl, target) {
  this.destination = destination;
  this.targetUrl  = targetUrl;
  this.target = target;

  ld.bindAll(this, G$.w('run openBrowser navigateToPage storeImage closeBrowser setPageDimensions setCaptureRegion recordExcludedRegions'));
};

CaptureImage.prototype.run = function (callback) {
  async.series([
    this.openBrowser,
    this.setPageDimensions,
    this.navigateToPage,
    this.setCaptureRegion,
    this.recordExcludedRegions,
    this.storeImage
  ], function (err, results) {
    this.closeBrowser();
    callback(err);
  }.bind(this));
};

CaptureImage.prototype.openBrowser = function (callback) {
  var options = {};
  if (CaptureImage.phantomPath) { options.phantomPath = CaptureImage.phantomPath; }

  phantom.create(function (err, pageHelper) {
    if (err) { return err; }
    this.pageHelper = pageHelper;
    pageHelper.createPage(function (err, page) {
      if (err) { return err; }
      this.page = page;
      callback(null, page);
    }.bind(this));
  }.bind(this), options);
};

CaptureImage.prototype.setPageDimensions = function (callback) {
  var dimensions = {
    width: this.target.width || 1200,
    height: this.target.height || 800
  };
  this.page.setViewport(dimensions, function (err) {
    callback(err);
  });
};

CaptureImage.prototype.navigateToPage = function (callback) {
  this.page.open(this.targetUrl, function (err, status) {
    ld.delay(callback, this.target.delay || 1000, err);
  }.bind(this));
};

CaptureImage.prototype.setCaptureRegion = function (callback) {
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

CaptureImage.prototype.recordExcludedRegions = function (callback) {
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

CaptureImage.prototype.storeImage = function (callback) {
  this.page.render(this.destination, function (err) {
    callback(err);
  });
};

CaptureImage.prototype.closeBrowser = function () {
  if (this.pageHelper) {
    this.pageHelper.exit();
    this.pageHelper = null;
    this.page = null;
  }
};

module.exports = CaptureImage;
