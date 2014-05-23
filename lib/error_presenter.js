'use strict;'
var ld = require('lodash')

exports.display = function (err) {
  if (err.message) {
    console.log(err.message);
  } else if (err.stack) {
    console.log(err.stack);
  } else {
    console.log("unknown error")
    console.log(err);
  }
  console.log('ERROR'.red);
}
