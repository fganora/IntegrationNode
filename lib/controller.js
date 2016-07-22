/*
Copyright (c) 2016-2016 Francesco Ganota, http://francescoganora.com
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

//
//  integration-node/lib/controller.js
//
//  This creates the Integration-Node controller process
//

const express = require('express');
const exphbs = require('express-handlebars');
const os = require('os');

module.exports = Controller;


// global controller vars
var port;
var baseDir;


function Controller(options, basedir) {
  var controller = express();
  baseDir = basedir;

  // set controller view engine and port
  controller.engine('handlebars', exphbs({defaultLayout: 'main'}));
  controller.set('view engine', 'handlebars');
  port = options.port || 3000;
  controller.set('port', port);

  console.log(basedir);
  // static assets route
  controller.use(express.static(baseDir + '/public'));

  //
  //  define routes
  //
  controller.get('/', homePage);
  controller.get('/components', componentsPage);
  controller.get('/log', logPage);
  controller.get('/integrations', integrationsPage);
  // 404 page
  controller.use(notFoundPage);
  // 500 page
  controller.use( serverErrorPage );

  var controllerServer = controller.listen(controller.get('port'), function afterControllerStart() {
    var host = controllerServer.address().address;
    var port = controllerServer.address().port;
    console.log('Integration-Node controller started http://%s:%s ', host, port);
    console.log('Type ctrl-C to quit');
  })

  return controller;
}


//
//
//  CONTROLLER UI functions
//
//

function homePage (req, res) {
  var dataObj = { osType: os.type(),
                  osRelease: os.release(),
                  architecture: os.arch(),
                  hostName: os.hostname(),
                  uptime: os.uptime(),
                  homeDir: os.homedir(),
                  portNr: port,
                  baseDir: baseDir
  };
  res.render('home', dataObj);
}

function componentsPage (req, res) {
  res.render('components');
}

function logPage (req, res) {
  res.render('log');
}


function integrationsPage (req, res) {
  res.render('integrations');
}

// 404 catch-all handler (middleware)
function notFoundPage(req, res) {
    res.status(404);
    res.render('400');
}

// 500 error handler (middleware)
function serverErrorPage(err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render('500');
}
