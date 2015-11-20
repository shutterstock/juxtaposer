'use strict';
var path     = require('path');
var nopt     = require('nopt');
var ld       = require('lodash');
var fs       = require('fs');
var G$       = require('./global_helpers');
var defaults = require('./defaults');

var KNOWN_OPTS = {
  "env":              [String, "dev"],
  "config":           [String, null],
  "base-env":         [String, null],
  "report-template":  [String, null],
  "test-only":        [Boolean, false],
  "report":           [Boolean, false],
  "init":             [Boolean, false],
  "export":           [Boolean, null],
  "export-path":      [String, null],
  "targets":          [String, null],
  "simple-out":       [Boolean, false],
  "ignore-exit-code": [Boolean, false]
};

var VALID_OPTIONS = ld.keys(defaults);

var SHORTHANDS = { };

var loadConfig = function (rootPath, argPath) {
  //TODO extract
  var configPath =  path.resolve(rootPath, argPath || "juxtaposer.json");
  if (!fs.existsSync(configPath)) { return {}; }
  var buffer = fs.readFileSync(configPath);
  var data = JSON.parse(buffer.toString());
  return ld.pick(data, VALID_OPTIONS);
};

var ARGS_TO_OPTIONS_MAPPINGS = {
  "env": "targetEnv",
  "base-env": "baselineEnv",
  "test-only": "testOnly",
  "report": "showReport",
  "export": "export",
  "export-path": "exportPath",
  "report-template": "reportTemplate",
  "simple-out": "simpleOut",
  "targets": "targetsPath",
  "ignore-exit-code": "ignoreExitCode"
};

var extractOverrides = function (args) {
  var results = {};
  ld.each(ARGS_TO_OPTIONS_MAPPINGS, function (newName, oldName) {
    if (ld.has(args, oldName)) {
      results[newName] = args[oldName];
    }
  });
  return results;
};

function OptionBuilder () {
  var args = nopt(KNOWN_OPTS, SHORTHANDS, process.argv);
  //TODO extract
  var config = loadConfig(process.cwd(), args.config);
  var argOverrides = extractOverrides(args);
  var options = ld.defaults(argOverrides, config, defaults);

  options.cwd = process.cwd();
  options.libraryDir = __dirname;

  options.isBaselineNeeded = ld.has(args, "base-env");
  options.isUsingCustomReport = ld.has(args,"report-template");

  //fix paths
  options.imagesDir   = path.resolve(options.cwd, options.imagesDir);
  options.exportPath = path.resolve(options.cwd, options.exportPath);
  if (options.reportTemplate) {
    options.reportTemplate = path.resolve(options.cwd, options.reportTemplate);
  }

  G$.w("baselinesDir samplesDir diffsDir reportPath").forEach(function (key) {
    options[key] = path.resolve(options.imagesDir, options[key]);
  });

  options.phantomPath = path.resolve(options.libraryDir, "../node_modules/.bin/");
  if (!fs.existsSync(options.phantomPath)) {
    delete options.phantomPath;
  }

  return options;
}

module.exports = OptionBuilder;
