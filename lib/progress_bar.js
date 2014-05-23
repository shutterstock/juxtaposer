'use strict;'

var Progress = require('progress')

var fakeStream = {
  isTTY: true,
  clearLine: function () {},
  cursorTo: function () {},
  write: function write(str) {
    console.log(str)
  }
}

function ProgressBar () {}

ProgressBar.attach = function (action) {
  if (!action.on) { console.log('guard'); return; }
  var progressBar = null;
  action.on("start", function (data) {
    progressBar = new Progress(data.title + ":current/:total [:bar] :percent :etas", {
      stream: (ProgressBar.simpleOut && !process.stderr.isTTY) ? fakeStream : process.stderr,
      total: data.size,
      width: (data.width || 65)
    })
  })
  action.on("tick", function (result) {
    if (progressBar) {
      progressBar.tick();
    }
  });
}

module.exports = ProgressBar;
