'use strict';

var ld   = require('lodash');
var G$   = require('./global_helpers');
var async   = require('async');
var phantom = require('phantom');
var semlocks = require('semlocks');
var os = require("os");

semlocks.setMaxLocks('phantom', os.cpus().length);

function endsWith(text, suffix) {
  return text.indexOf(suffix, text.length - suffix.length) !== -1;
}

function Paparazzo(options) {
  if (!options) { options = {}; }

  if (options.phantomPath && !endsWith(options.phantomPath, "/")) {
    options.phantomPath = options.phantomPath + "/"
  }

  this.phantomOptions = {
    path: options.phantomPath ,
    logLevel: 'warn'
  };

  ld.bindAll(this, G$.w('capture setTarget setup navigateToPage waitForPageLoad storeImage close setPageDimensions setCaptureRegion recordExcludedRegions'));
}

Paparazzo.prototype.setup = function (callback) {
  var self = this;
  self._requestsArray = []
  self._isResourceRequested = false
  if (self.page) { return callback(null, self.page) }
  semlocks.acquire("phantom", { wait: 30000 }, function (err, release) {
    var newCallback = function (e, r) {
      if (release) { release(); }
      callback(e, r);
    };

    if (err) { return newCallback(err); }
    var phantomCreatePromise = phantom.create(['--disk-cache=true'], self.phantomOptions)
    phantomCreatePromise.then(function (pageHelper) {
      self.pageHelper = pageHelper;
      return self.pageHelper.createPage()
    }).then(function (page) {
      self.page = page

      page.on('onResourceRequested',  function (requestData, networkRequest) {
        self._isResourceRequested = true
        self._requestsArray.push(requestData.id)
      })
      page.on('onResourceReceived',  function(response) {
        var index = self._requestsArray.indexOf(response.id);
        self._requestsArray.splice(index, 1);
      })

      newCallback(null, page)
    })
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
    this.waitForPageLoad,
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

  this.page.property('viewportSize', dimensions).then(function () {
    callback()
  }).catch(callback)
};

Paparazzo.prototype.navigateToPage = function (callback) {
  var self = this;
  self.page.open(self.targetUrl).then(function (status) {
    if (status !== 'success') {
      var err = "Failed to open " + self.targetUrl
      callback(err)
    } else {
      callback()
    }
  }).catch(callback)
};

Paparazzo.prototype.setCaptureRegion = function (callback) {
  if (!this.target.onlyRegion) { return callback(); }
  var self = this

  if (ld.isString(self.target.onlyRegion)) {

    self.page.evaluate(function (s) {
      return document.querySelector(s).getBoundingClientRect();
    }, self.target.onlyRegion).then(function (clipRect){
        return self.page.property('clipRect', clipRect)
    }).then(function () {
        callback();
    }).catch(callback)
  } else {
    var clipRect = ld.object(G$.w("left top width height"), self.target.onlyRegion);
    self.page.property('clipRect', clipRect).then( function () {
      callback();
    }).catch(callback);
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
    }, selector).then(function (clipRect) {
      self.target.excludeRegions.push(clipRect);
      cb();
    });
  },function (err) {

    if (err) { return callback(err); }
    self.target.excludeRegions = ld.flatten(self.target.excludeRegions);
    callback();
  });
};

Paparazzo.prototype.waitForPageLoad = function waitForPageLoad (callback) {
  var self = this

  var attempts = 0
  var poll_interval = 250
  var max_delay =  5 * 1000 // 5 seconds
  var max_attempts =  max_delay / poll_interval

  var interval = setInterval(function () {
    var hasStarted = self._isResourceRequested
    var isNothingLeft = self._requestsArray.length === 0
    var isOverMax = attempts > max_attempts

    if ((hasStarted && isNothingLeft) || isOverMax) {
      clearInterval(interval);
      callback()
    }
  }, poll_interval);
}

Paparazzo.prototype.storeImage = function (callback) {
  this.page.render(this.destination).then(function () {
    callback()
  }).catch(callback)
};

module.exports = Paparazzo;
