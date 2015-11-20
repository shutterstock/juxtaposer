'use strict';
var ld     = require('lodash');
var util   = require('util');
var events = require("events");
var async  = require('async');
var G$     = require('./global_helpers');
var Pool   = require('advanced-pool');
var Paparazzo    = require("./paparazzo");

var _pool;

module.exports = function (settings) {
  if (!_pool) {
    var _pool = new Pool.Pool({
      min: 0,
      max: settings.maxPhantoms,
      create: function (done) {
        var resource =  new Paparazzo(settings);
        done(null, resource)
      },
      destroy: function (resource) {
        resource.close();
      }
    });

    _pool.on("create-error", function (err) {
      console.log("ERROR: ", err)
    })
  }
  return _pool
}
