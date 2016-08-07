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

/**
//  Global Integration-Node variables
//  integration-node/lib/integration-configuration.js
//
//  This source holds global variable shared across the main module and the controller module
*/
var IntegrationConfiguration = {
      /** Load complete configuration */
      loadSync:  function() {
          globals.instanceLogger.verbose('Deleting existing data source configuration in Redis DB.');
          globals.instanceRedisConnection.del("int-node::datasources")
            .then(function() {
              globals.instanceLogger.info('Loading configuration for data sources ...');
              globals.instanceConfiguration['data-sources'].forEach( function(ds) {
                IntegrationConfiguration.loadDataSourceConfigSync(ds);
              });
              globals.instanceLogger.info('Loading configuration for integrations ...');
              let integrationConfigFiles = fs.readdirSync(globals.baseDir + '/config/integrations')
                .filter( function (f) { return ((f.search(/json$/i)) !== -1 ); } );
              integrationConfigFiles.forEach( function(f) {
                IntegrationConfiguration.loadIntegrationGroupConfigSync(f);
              } );


            })
            .catch((err) => {
              globals.instanceLogger.error('Error deleting previous data source configuration from Redis DB. ' +
                'Integration-Node instance must abort. Original error is: %j' + err);
                process.exit(1);
            });

      },

      loadDataSourceConfigSync: function(ds) {
        globals.instanceLogger.verbose('Loading data source configuration from file ' + '/config/datasources/' + ds + '.json');
        let dataSourceConfigFileContents = fs.readFileSync(globals.baseDir + '/config/datasources/' + ds + '.json').toString();
        let dataSourceConfig = JSON.parse(dataSourceConfigFileContents);
        globals.instanceLogger.verbose('Configuration loaded for data source ' + ds + ' : ' + dataSourceConfigFileContents);
      },

      loadIntegrationGroupConfigSync: function (integrationGroupConfigFile) {
        globals.instanceLogger.verbose('Loading integration configuration from file %s ...', integrationGroupConfigFile);
        let integrationGroupConfig = JSON.parse(fs.readFileSync(globals.baseDir + '/config/integrations/' + integrationGroupConfigFile));

        globals.instanceLogger.verbose('Configuration loaded for integration group : ' + JSON.stringify(integrationGroupConfig));
      }

}

module.exports = IntegrationConfiguration;
