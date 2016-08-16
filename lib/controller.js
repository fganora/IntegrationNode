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


const express = require('express');
const exphbs = require('express-handlebars');
const cp = require('child_process');
const os = require('os');

const globals = require('./globals.js');
const logUtils = require('./log-utils.js');


var dataSourceController;


module.exports = Controller;

/**
//  @module Controller
//  integration-node/lib/controller.js
//
//  This creates the Integration-Node controller process
*/
function Controller() {
  var controller = express();  // instantiate controller Express app


  var dataSourceArgs = [...globals.instanceConfiguration['data-sources']];
      dataSourceArgs.unshift(globals.baseDir);   // push root Integration-Node directory to child process
  dataSourceController = cp.fork(`${globals.baseDir}/lib/data-source.js`, dataSourceArgs);


  // handle message from child Data Source Controller
  dataSourceController.on('message', (msg) => {
    if (msg.status === "ERROR") {
       globals.instanceLogger.error('Data Source Controller reported error: ' + JSON.stringify(msg.errorDetails));
    }
    else if (msg.status === "INFO") {
       globals.instanceLogger.info(msg.infoMsg);
    }
    else  if (msg.status === "VERBOSE") {
       globals.instanceLogger.verbose(msg.infoMsg);
    }
     else  if (msg.status === "DEBUG") {
       globals.instanceLogger.debug(msg.infoMsg);
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
  controller.get('/datasources/:dsname', singleDataSourcePage);
  controller.get('/datasources', dataSourcesPage);
  controller.get('/datasource/toggle', toggleDataSource);
  controller.get('/log', logPage);
  controller.get('/integration-groups/:igname', singleIntegrationGroupPage);
  controller.get('/integration-groups', integrationGroupsPage);
  controller.get('/integration-group/toggle', toggleIntegrationGroup);

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

/** home page UI */
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


/** Instance Log  page UI */
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
      .catch ( (err) => {
        globals.instanceLogger.error('Error reading instance log: %j', err);
      } );
  }


/** Data sources page UI */
  function dataSourcesPage (req, res) {
    var contextObj = {
      dataSources: []
    };
    // read datasource data from Redis DB
    globals.instanceRedisConnection.hkeys("int-node::datasources")
      .then( (dsArray) => {
        for (let ds of dsArray) {
          globals.instanceRedisConnection.hget("int-node::datasources", ds)
            .then ( (dsData) => {
              let dsConfigObj = JSON.parse(dsData);
              let dsConfigObjUI = { name: dsConfigObj.name,
                                    active: dsConfigObj.active,
                                    type: dsConfigObj.type,
                                    logUnmatchedEvents: dsConfigObj.logUnmatchedEvents,
                                    config: JSON.stringify(dsConfigObj.config),
                                    integrationGroups: dsConfigObj.integrationGroups
                                  };
             contextObj.dataSources.push(dsConfigObjUI);
            } )
            .catch( (err) => {
              globals.instanceLogger.error('Error reading datasource configuration from Redis: %j', err);
            });
        }
        res.render('datasources', contextObj);
      })
      .catch( (err) => {console.log(err);} );
  }


/** Single data sources page UI */
  function singleDataSourcePage (req, res) {
    var contextObj;

    globals.instanceRedisConnection.hget("int-node::datasources", req.params.dsname)
      .then ( (dsData) => {
        let dsConfigObj = JSON.parse(dsData);
        contextObj = { name: dsConfigObj.name,
                      active: dsConfigObj.active,
                      type: dsConfigObj.type,
                      logUnmatchedEvents: dsConfigObj.logUnmatchedEvents,
                      config: JSON.stringify(dsConfigObj.config),
                      triggers: []
                    };
        dsConfigObj.triggers.forEach( function(trg) {
          let triggerObj = {triggerFields: [], integration: trg.integration};
          let triggerFields = Object.keys(trg.triggerConfig);
          // console.log(triggerFields);
          triggerFields.forEach( function(trgField) {
            triggerObj.triggerFields.push({fieldName: trgField, fieldValue: trg.triggerConfig[trgField]});
          });
          contextObj.triggers.push(triggerObj);

        });
        res.render('single-datasource', contextObj);
      })
      .catch( (err) => {
        globals.instanceLogger.error('Error reading datasource configuration from Redis: %j', err);
      });
  }

/** Data source active status toggling */
  function toggleDataSource (req, res) {
      var dsConfigObj;
      var oldActivationStatus;

      globals.instanceRedisConnection.hget("int-node::datasources", req.query.ds_name)
        .then ( (dsData) => {
          dsConfigObj = JSON.parse(dsData);
          oldActivationStatus = dsConfigObj.active;
          dsConfigObj.active = (dsConfigObj.active) ? false : true;
          return globals.instanceRedisConnection.hset("int-node::datasources", req.query.ds_name, JSON.stringify(dsConfigObj));
        })
        .then ( (reply) => {
          if (oldActivationStatus) {
            dataSourceController.send({deactivateDataSource: req.query.ds_name});
          }
          else {
            dataSourceController.send({activateDataSource: req.query.ds_name});
          }
          res.redirect(303, '/datasources');
        })
        .catch( (err) => {
          globals.instanceLogger.error('Error reading or writing datasource configuration from/to Redis: %j', err);
          res.redirect(303, '/datasources');
        });
  }





/** Integration Groups page UI */
  function integrationGroupsPage (req, res) {
     var contextObj = {
      integrationGroups: []
    };
    // read integration group data from Redis DB
    globals.instanceRedisConnection.hkeys("int-node::integration-groups")
      .then( (igArray) => {
        for (let ig of igArray) {
          globals.instanceRedisConnection.hget("int-node::integration-groups", ig)
            .then ( (igData) => {
              let igConfigObj = JSON.parse(igData);

             contextObj.integrationGroups.push(igConfigObj);
            } )
            .catch( (err) => {
              globals.instanceLogger.error('Error reading integration group configuration from Redis: %j', err);
            });
        }
        res.render('integration-groups', contextObj);
      })
      .catch ( (err) => {
          globals.instanceLogger.error('Error reading or writing integration group configuration from/to Redis: %j', err);
          res.redirect(303, '/integration-groups');
      });
  }


/** Integration Group active status toggling */
  function toggleIntegrationGroup (req, res) {
      var igConfigObj;
      var oldActivationStatus;

      globals.instanceRedisConnection.hget("int-node::integration-groups", req.query.ig_name)
        .then ( (igData) => {
          igConfigObj = JSON.parse(igData);
          oldActivationStatus = igConfigObj.active;
          igConfigObj.active = (igConfigObj.active) ? false : true;
          return globals.instanceRedisConnection.hset("int-node::integration-groups", req.query.ig_name, JSON.stringify(igConfigObj));
        })
        .then ( (reply) => {
          if (oldActivationStatus) {
            // TODO
            // dataSourceController.send({deactivateDataSource: req.query.ds_name});
          }
          else {
            // TODO
            // dataSourceController.send({activateDataSource: req.query.ds_name});
          }
          res.redirect(303, '/integration-groups');
        })
        .catch( (err) => {
          // globals.instanceLogger.error('Error reading or writing integration group configuration from/to Redis: %j', err);
          res.redirect(303, '/integration-groups');
        });
  }


/** Single Integration Group page UI */
  function singleIntegrationGroupPage (req, res) {
     var contextObj;
    // read integration group data from Redis DB

      globals.instanceRedisConnection.hget("int-node::integration-groups", req.params.igname)
      .then ( (igData) => {
        let igConfigObj = JSON.parse(igData);
        contextObj = { name: igConfigObj.name,
                      active: igConfigObj.active,
                      dataSource: igConfigObj.datasource,
                      integrations: []
                    };
        igConfigObj.integrations.forEach( function(integr) {
          let integrationObj = {name: integr.name, active: integr.active, type: integr.type, triggers: [], routings:[]};
          integr.triggering.forEach( function (trg) {
            let triggerObj = {triggerFields:[]};
            let triggerFlds = Object.keys(trg);
            triggerFlds.forEach( function(trgField) {
              triggerObj.triggerFields.push({fieldName: trgField, fieldValue: trg[trgField]});
            });
            integrationObj.triggers.push(triggerObj);
          });
          integr.routing.forEach( function (rout) {
            let routingObj = {routingAttributes:[]};
            let routingAttrs = Object.keys(rout);
            routingAttrs.forEach( function(routAttr) {
              routingObj.routingAttributes.push({attributeName: routAttr, attributeValue: rout[routAttr]});
            });
            integrationObj.routings.push(routingObj);
          });

          contextObj.integrations.push(integrationObj);

        });
        res.render('single-integration-group', contextObj);
      })
      .catch( (err) => {
        globals.instanceLogger.error('Error reading integration group configuration from Redis: %j', err);
      });

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

