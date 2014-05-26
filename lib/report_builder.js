'use strict';

var ld   = require('lodash');
var swig = require('swig');
var path = require('path');
var fs   = require('fs');
var exec = require('child_process').exec;
var G$   = require('./global_helpers');

function ReportBuilder(settings) {
  this.settings = ld.cloneDeep(settings);

  ld.bindAll(this, G$.w('generate cleanResults'));
}

ReportBuilder.prototype.generate = function (results) {
  results = ld.cloneDeep(results);

  var cleanResults = this.cleanResults(results.test);
  cleanResults = ld.sortBy(cleanResults, "prettyName");
  var testResults  = ld.groupBy(cleanResults, "state");
  var settings = this.displayInfo(this.settings);

  var reportTemplate = (this.settings.isUsingCustomReport) ? this.settings.reportTemplate : path.join(this.settings.libraryDir, 'basic_report_template.html');

  var report = swig.renderFile(reportTemplate, {
    settings: settings,
    tests: testResults
  });

  fs.writeFileSync(this.settings.reportPath, report);
  if (this.settings.showReport) {
    exec('open ' + this.settings.reportPath);
  }
};

ReportBuilder.prototype.cleanResults = function (results) {
  var self = this;
  return ld.map(results, function (result) {
    return ld.mapValues(result, function (val) { return self.makePathRelative(val, self.settings.imagesDir);});
  });
};

ReportBuilder.prototype.makePathRelative = function (fullPath, extraPart) {
  if (!ld.isString(fullPath)) { return fullPath; }

  return fullPath.replace(extraPart, "").replace(/^\//, '');
};

ReportBuilder.prototype.displayInfo = function (options) {
  var info = ld.pick(options, G$.w("cwd targetEnv baselineEnv isBaselineNeeded "));
  info.ranAt = new Date().toUTCString();
  return info;
};

module.exports = ReportBuilder;
