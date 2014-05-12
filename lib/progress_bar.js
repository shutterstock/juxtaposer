'use strict;'

var progress = require('progress')


function ProgressBar() {}

ProgressBar.attach = function (action) {
  if (!action.on) { console.log('guard'); return; }
  var progressBar = null;
  action.on("start", function (data) {
    progressBar = new progress(data.title + ":current/:total [:bar] :percent :etas", {
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
