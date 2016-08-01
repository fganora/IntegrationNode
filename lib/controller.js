/*
Copyright (c) 2016-2016 Francesco Ganora, http://francescoganora.com
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
const cp = require('child_process');
const os = require('os');

const globals = require('./globals.js');
const logUtils = require('./log-utils.js');



module.exports = Controller;

function Controller() {
  var controller = express();  // instantiate controller Express app


  // purge Data Source Data from Redis DB and spawn data sources
  globals.instanceRedisConnection.del("int-node:datasources").catch((err) => {console.log(err);});
  var dataSourceArgs = [...globals.instanceConfiguration['data-sources']];
      dataSourceArgs.unshift(globals.baseDir);   // push root Integration-Node directory to child process
  var dataSourceController = cp.fork(`${globals.baseDir}/lib/data-source.js`, dataSourceArgs);


  // handle message from child Data Source Controller
  dataSourceController.on('message', (msg) => {
    if (msg.status === "INFO") {
       globals.instanceLogger.info(msg.infoMsg);
    }
    else  if (msg.status === "VERBOSE") {
       globals.instanceLogger.verbose(msg.infoMsg);
    }
    else if (msg.status === "ERROR") {
       globals.instanceLogger.error('Data Source Controller reported error: ' + JSON.stringify(msg.errorDetails));
    }
  });

  globals.instanceLogger.verbose('Setting up Integration-Node Controller UI ...');
  // set controller view engine and port
  controller.engine('handlebars', exphbs({defaultLayout: 'main'}));
  controller.set('view engine', 'handlebars');
  controller.set('port', globals.controllerPort);

  // static assets route
  controller.use(express.static(globals.baseDir + '/public'));

  // add page testing routes
  controller.use(function(req, res, next) {
    res.locals.showTests = globals.environment !== 'production' && req.query.test === '1';
    next();
  });


  //
  //  define controller UI routes
  //
  controller.get('/', homePage);
  controller.get('/datasources', dataSourcesPage);
  controller.get('/log', logPage);
  controller.get('/integrations', integrationsPage);
  // 404 page
  controller.use(notFoundPage);
  // 500 page
  controller.use(serverErrorPage);

  var controllerServer = controller.listen(controller.get('port'), function afterControllerStart() {
    var host = controllerServer.address().address;
    var port = controllerServer.address().port;
    globals.instanceLogger.info('Integration-Node controller UI started at http://%s:%s. Type ctrl-C to quit.', host, port);
  })

  return controller;
}


  //
  //
  //  CONTROLLER UI functions
  //
  //

  function homePage (req, res) {
    var contextObj = { osType: os.type(),
                    osRelease: os.release(),
                    architecture: os.arch(),
                    hostName: os.hostname(),
                    uptime: os.uptime(),
                    homeDir: os.homedir(),
                    portNr: globals.controllerPort,
                    baseDir: globals.baseDir,
                    env: globals.environment,
                    redisSocket: globals.redisSocket,
                    redisDb: globals.redisDb,
                    logLevel:  globals.logLevel
    };
    res.render('home', contextObj);
  }


  function dataSourcesPage (req, res) {
    var contextObj = {
      dataSources: []
    };
    // read datasource data from Redis DB
    globals.instanceRedisConnection.hkeys("int-node:datasources")
      .then( (dsArray) => {
        for (let ds of dsArray) {
          globals.instanceRedisConnection.hget("int-node:datasources", ds)
            .then ( (dsData) => {
             // console.log(dsData);
             contextObj.dataSources.push(JSON.parse(dsData));
            } )
            .catch( (err) => {console.log(err);} );
        }
      })
      .catch( (err) => {console.log(err);} );

      res.render('datasources', contextObj);
  }


  function logPage (req, res) {
    var contextObj = {
      logData: []
    };

    // read log entries from file
    logUtils.readInstanceLog()
      .then((data) => {
        // console.log(data);
        contextObj.logData = data;
        res.render('log', contextObj);
      })
      .catch( (err) => {console.log(err);} );
  }


  function integrationsPage (req, res) {
    res.render('integrations');
  }

  // 404 catch-all handler (middleware)
  function notFoundPage (req, res) {
      res.status(404);
      res.render('400');
  }


  // 500 error handler (middleware)
  function serverErrorPage (err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
  }

