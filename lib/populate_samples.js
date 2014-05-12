
'use strict;'
var util = require('util')
var events = require("events");
var ld = require('lodash');
var swig  = require('swig');

var rockSpawn = require('./rock_exec').spawn;
var externalEvent = require('./external_event')


function PopulateSamples(options, settings) { 
  this.opts = options;
  this.settings = settings;

  ld.bindAll(this, ['run', 'command', 'parseOutput'])
}
util.inherits(PopulateSamples, events.EventEmitter);

PopulateSamples.prototype.run = function (cb) { 

  rockSpawn(this.command(), this.settings.seleniumDir, {stdout: this.parseOutput, stderr: this.parseOutput}, function (err, stdout, stderr) {
    cb(err);
  });
}

PopulateSamples.prototype.command = function () { 
  var command = swig.render(this.settings.populateCmd, {  locals: {
    destination: this.opts.dest,
    environment: this.opts.env
  }})
  return command
}

PopulateSamples.prototype.parseOutput = function (data) { 
  data = data.toString()
  if (!externalEvent.isValid(data)) { return; }

  var message = new externalEvent(data);
  if (message.name == "start") { 
    message.payload.title = this.opts.title || "Capturing Images:"
  }
  this.emit(message.name, message.payload);
}

module.exports = PopulateSamples;
