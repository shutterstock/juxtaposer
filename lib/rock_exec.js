'use strict;'
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var ld = require('lodash');


function RockExec(command, workingDir, cb) {
  var newEnv = ld.clone(process.env);
  delete newEnv.ROCK_ENV;
  delete newEnv.ROCK_PATH;
  delete newEnv.ROCK_RUNTIME;
  exec(command, { env: newEnv, cwd: workingDir }, cb);
}

function RockSpawn(command, workingDir, options, cb) {
  var newEnv = ld.clone(process.env);
  delete newEnv.ROCK_ENV;
  delete newEnv.ROCK_PATH;
  delete newEnv.ROCK_RUNTIME;
  command = command.split(/\s+/)
  var cmd = spawn(command.shift(), command, { env: newEnv, cwd: workingDir }, cb);
  if (options.stdout) {
    cmd.stdout.on('data', options.stdout)
  }
  if (options.stderr) {
    cmd.stderr.on('data', options.stderr || function (data) { console.log(data.toString().red)})
  }
  cmd.on('close', function (code) {
    cb(code);
  })

}
exports.spawn = RockSpawn;
exports.exec = RockExec;
