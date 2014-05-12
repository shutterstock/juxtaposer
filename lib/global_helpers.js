'use strict;'

var ld = require('lodash')

var toWords = function (strData) {
  if (ld.isEmpty(strData)) { return [] }
  return ld.pull(strData.split(/\s+/), '')
}

module.exports = {
  w: toWords
}
