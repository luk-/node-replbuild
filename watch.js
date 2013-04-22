#!/usr/bin/env node

var argv = require('optimist').argv
var fs = require('fs')
var exec = require('child_process').exec
var repl = require('repl')
var crypto = require('crypto')
var path = require('path')

var actions = {
  html: function (file) {
    r.context.rebuild()
  }
}

md5sums = {}

watchDir = ['./public', './public/partials']
procName = 'wayla'
enable = true

if (argv.watch) {
  watchDir = argv.watch
}

var replConfig = {
  prompt: process.cwd() + 'watchDir' + ' > ',
  input: process.stdin,
  output: process.stdout
}


var r = repl.start(replConfig)


r.context.rebuild = function () {
  r.context.pid('wayla', function (err, pid) {
    if (pid) {
      r.context.kill (pid, function () {
        var child = exec('make start').stdio
        child[1].pipe(process.stdout)
      })
    }
  })
  // var child = exec('make start').stdio
  // child[1].pipe(process.stdout)
}

r.context.pid = function (procName, cb) {
  var child = exec("ps aux | grep '[n]ode'| awk '/" + procName + "/ {printf $2}'", function (err, stdout, stderr) {
    if (err) return cb(err)
    if (stderr) return cb(stderr)
    cb(null, stdout)
  })
}

r.context.kill = function (pid, cb) {
  var kill = process.kill(pid)
  cb()
}

r.context.start = function (dir) {
  dir = dir || watchDir
  if (Array.isArray(dir)) {
    dir.forEach(function (val) {
      read(val)
    })
  }
  else {
    read(dir)
  }
}

function read (dir) {
  if (!enable) return


  var directory = fs.watch(dir)
  directory.on('change', function (event, filename) {
    if (fs.existsSync(path.resolve(dir, filename))) {
      var hash = crypto.createHash('md5')
      hash.setEncoding('hex')
      var md5 = fs.createReadStream(path.resolve(dir, filename)).pipe(hash)
      md5.on('data', function (hex) {
        if (md5sums[hex]) {
          return
        }
        else {
          md5sums[hex] = true
        }
      })  
    }

    var filetype = filename.split('.').reverse()[0]
    if (actions[filetype]) {
      actions[filetype](filename)
    }
  })
}
