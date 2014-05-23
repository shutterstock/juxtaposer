'use strict;'
var async    = require('async');
var colors   = require('colors');
var path     = require('path');
var ld       = require('lodash')

var Preconditions     = require('./preconditions')
var GatherScreenshots = require('./gather_screenshots')
var TestImages        = require('./test_images')
var CleanupDirs       = require('./cleanup_dirs')
var Manifest          = require('./manifest')

//reports
var ResultsPresenter = require('./results_presenter')
var ReportBuilder    = require('./report_builder');
var ExportResults    = require('./export_results')

var errorPresenter = require('./error_presenter')
var optionBuilder  = require('./option_builder');
var progressBar    = require('./progress_bar');

var options = optionBuilder();
options.targets = (new Manifest(options)).load()

if (options.simpleOut) {
  colors.mode = "none"
  progressBar.simpleOut = true;
}

var testRunner = new TestImages(options);
progressBar.attach(testRunner)
var paparazzi = new GatherScreenshots(options);
progressBar.attach(paparazzi)

var actions = {
  check:   (new Preconditions(options)).run,
  cleanup: (new CleanupDirs(options)).run,
  gather:  paparazzi.run,
  test:    testRunner.run
};

if (options.testOnly) {
  delete actions.cleanup
  delete actions.gather;
}

async.series(actions, function (err, results) {
  if (err) {
    errorPresenter.display(err);
    process.exit(1);
  } else {
    var reports = [ReportBuilder, ResultsPresenter]
    reports = ld.map(reports, function (Klass) { return new Klass(options); })
    async.series({
      buildReports: function (cb) {
        async.each(reports, function (report, cbInner) {
          report.generate(results); cbInner()
        }, cb)
      },
      exportReport: function (cb) {
        var exporter = new ExportResults(options)
        exporter.generate(cb);
      }
    }, function (err, results) {
      process.exit(ResultsPresenter.getExitCode(results));
    })
  }
});

console.log('Running...'.blue)
