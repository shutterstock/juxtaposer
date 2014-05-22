'use strict;'
var path = require('path')
var nopt = require('nopt')
var ld = require('lodash')
var fs = require('fs')
var G$ = require('./global_helpers')
var defaults = require('./defaults')

var KNOWN_OPTS = {
  "env":             [String, "dev"],
  "config":          [String, null],
  "base-env":        [String, null],
  "report-template": [String, null],
  "test-only":       [Boolean, false],
  "report":          [Boolean, false],
  "init":            [Boolean, false],
  "export":          [Boolean, null],
  "export-path":     [String, null],
  "targets":         [String, null],
  "simple-out":      [Boolean, false]
}

var VALID_OPTIONS = ld.keys(defaults);

var SHORTHANDS = { };

var loadConfig = function (rootPath, argPath) {
  //TODO extract
  var configPath =  path.resolve(rootPath, argPath || "juxtaposer.json")
  if (!fs.existsSync(configPath)) { return {}; }
  var buffer = fs.readFileSync(configPath);
  var data = JSON.parse(buffer.toString());
  return ld.pick(data, VALID_OPTIONS);
}

var extractOverrides = function (args) {
  var overrides = {}

  //TODO would be better with a mapping object
  if (ld.has(args,"env"))       { overrides.targetEnv = args["env"] }
  if (ld.has(args,"base-env"))  { overrides.baselineEnv = args["base-env"] }
  if (ld.has(args,"test-only")) { overrides.testOnly = args["test-only"] }
  if (ld.has(args,"report"))    { overrides.showReport = args["report"] }
  if (ld.has(args,"export"))    { overrides.export = args["export"] }
  if (ld.has(args,"export-path")) { overrides.exportPath = args["export-path"] }
  if (ld.has(args,"init"))      { overrides.init = args["init"] }
  if (ld.has(args, "report-template")) { overrides.reportTemplate = args["report-template"] }
  if (ld.has(args, "export-path")) { overrides.exportPath = args["export-path"] }
  if (ld.has(args, "simple-out")) { overrides.simpleOut = args["simple-out"] }
  if (ld.has(args, "targets")) { overrides.targetsPath = args["targets"] }
  return overrides;
}

function OptionBuilder () {
  var args = nopt(KNOWN_OPTS, SHORTHANDS, process.argv)
  //TODO extract
  var config = loadConfig(process.cwd(), args.config)
  var argOverrides = extractOverrides(args)
  var options = ld.defaults(argOverrides, config, defaults)

  options.cwd = process.cwd();
  options.libraryDir = __dirname;

  options.isBaselineNeeded = ld.has(args, "base-env")
  options.isUsingCustomReport = ld.has(args,"report-template")

  //fix paths
  options.imagesDir   = path.resolve(options.cwd, options.imagesDir)
  options.exportPath = path.resolve(options.cwd, options.exportPath)
  if (options.reportTemplate) {
    options.reportTemplate = path.resolve(options.cwd, options.reportTemplate)
  }

  G$.w("baselinesDir samplesDir diffsDir reportPath").forEach(function (key) {
    options[key] = path.resolve(options.imagesDir, options[key])
  })

  options.phantomPath = path.resolve(options.libraryDir, "../node_modules/.bin/phantomjs")
  if (!fs.existsSync(options.phantomPath)) {
    delete options.phantomPath
  }

  return options;
}

module.exports = OptionBuilder;
