'use strict';

function ExternalEvent (message) {
  message = message.trim().replace(/^EVENT:/, '');
  this.payload = {};
  if (message.indexOf(' ') > 0) {
    this.name = message.substr(0, message.indexOf(' '));
    this.payload = JSON.parse(message.substr(message.indexOf(' ')));
  } else {
    this.name = message;
  }
  return this;
}

ExternalEvent.isValid = function (message) {
  return /^EVENT:\w+/.test(message);
};

module.exports = ExternalEvent;
