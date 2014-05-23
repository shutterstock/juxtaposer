"use strict;"

var defaults = {
  "targetEnv": "dev",
  "baselineEnv": "prod",
  "testOnly": false,
  "showReport": false,
  "export": false,
  "maxPhantoms": 5,
  "imagesDir": "test_images",
  "baselinesDir": "baselines",
  "samplesDir": "samples",
  "diffsDir": "diffs",
  "imagePattern": "*.png",
  "reportPath": "index.html",
  "exportPath": "jux-{{base_env}}-vs-{{sample_env}}-{{date}}.zip",
  "reportTemplate": false,
  "targetsPath": "targets.json",
  "substitutions": {},
  "simpleOut": false
}

module.exports = Object.freeze(defaults)
