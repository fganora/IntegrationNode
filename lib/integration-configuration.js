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

const fs = require('fs');
const globals = require('./globals.js');


// private module variables
var dataSources = {};
var integrationGroups = {};
var integrations = {};


/**
//  Global Integration-Node variables
//  integration-node/lib/integration-configuration.js
//
//  This source holds global variable shared across the main module and the controller module
*/
var IntegrationConfiguration = {
      /** Load complete configuration */
      loadSync:  function() {
          globals.instanceLogger.verbose('Deleting existing integration configuration in Redis DB...');
          Promise.all([ globals.instanceRedisConnection.del("int-node::datasources"),
                        globals.instanceRedisConnection.del("int-node::integration-groups"),
                        globals.instanceRedisConnection.del("int-node::integrations") ])
            .then ( function() {
              globals.instanceLogger.info('Loading configuration for data sources ...');
              globals.instanceConfiguration['data-sources'].forEach( function(ds) {
                IntegrationConfiguration.loadDataSourceConfigSync(ds);
              });
              globals.instanceLogger.info('Loading configuration for integrations ...');
              let integrationConfigFiles = fs.readdirSync(globals.baseDir + '/config/integrations')
                .filter( function (f) { return ((f.search(/json$/i)) !== -1 ); } );
              integrationConfigFiles.forEach( function(f) {
                IntegrationConfiguration.loadIntegrationGroupConfigSync(f);
              });
            })
            .then ( function() {
               // store configuration into Redis
              Object.keys(dataSources).forEach( function (ds) {
                globals.instanceRedisConnection.hset("int-node::datasources", ds, JSON.stringify(dataSources[ds]));
              });
              Object.keys(integrationGroups).forEach( function (ig) {
                globals.instanceRedisConnection.hset("int-node::integration-groups", ig, JSON.stringify(integrationGroups[ig]));
              })
              Object.keys(integrations).forEach( function (integr) {
                globals.instanceRedisConnection.hset("int-node::integrations", integr, JSON.stringify(integrations[integr]));
              })

            })
            .then ( function() {
               globals.instanceLogger.info('Integration configuration loaded.');
            } )
            .catch((err) => {
              globals.instanceLogger.error('Error loading integration configuration into Redis DB. ' +
                'Integration-Node instance must abort. Original error is: ' + err);
                process.exit(1);
            });

      },

      loadDataSourceConfigSync: function(ds) {
        globals.instanceLogger.verbose('Loading data source configuration from file ' + '/config/datasources/' + ds + '.json');
        let dataSourceConfigFileContents = fs.readFileSync(globals.baseDir + '/config/datasources/' + ds + '.json').toString();
        let dataSourceConfig = JSON.parse(dataSourceConfigFileContents);
        dataSources[dataSourceConfig.name] = dataSourceConfig;
        dataSources[dataSourceConfig.name].integrationGroups = [];
        dataSources[dataSourceConfig.name].triggers = [];
        // TODO
        globals.instanceLogger.verbose('Configuration loaded for data source ' + ds + ' : ' + dataSourceConfigFileContents);
      },

      loadIntegrationGroupConfigSync: function (integrationGroupConfigFile) {
        globals.instanceLogger.verbose('Loading integration configuration from file %s ...', integrationGroupConfigFile);
        let integrationGroupConfig = JSON.parse(fs.readFileSync(globals.baseDir + '/config/integrations/' + integrationGroupConfigFile));
        integrationGroups[integrationGroupConfig.name] = integrationGroupConfig;

        // link integration group to associated data source
        dataSources[integrationGroupConfig.datasource].integrationGroups.push(integrationGroupConfig.name);

        // populate 'integrations' object and add triggering info to data source
        integrationGroupConfig.integrations.forEach( function (integr) {
          let integrationKey = integrationGroupConfig.name + '/' + integr.name;
          integrations[integrationKey] = integr;
          integrations[integrationKey].active = (integrations[integrationKey].active && integrationGroupConfig.active);
          integrations[integrationKey].dataSource =  integrationGroupConfig.datasource;

          // add triggering info to DS
          integrations[integrationKey].triggering.forEach( function (trg) {
            let triggerObj = {triggerConfig: trg, integration: integrationKey};
            dataSources[integrationGroupConfig.datasource].triggers.push(triggerObj);
          }) ;



        });

        globals.instanceLogger.verbose('Configuration loaded for integration group : ' + JSON.stringify(integrationGroupConfig));
      }

}

function assignDataSourceTriggering() {

}

module.exports = IntegrationConfiguration;
