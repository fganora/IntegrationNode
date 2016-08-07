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



const cluster = require('cluster');
const fs =require('fs');
const RedisClient = require('./redis-client.js');


var baseDir;
var dataSourceRedisConnection;
var dsWorkers = {};
var dataSourceObject;


/**
//  integration-node/lib/data-source.js
//
//  This creates the Integration-Node data source processes according to configuration
*/
if (cluster.isMaster) {

    process.title = "Integration-Node DataSource Controller";
    baseDir = process.argv[2];
    process.send({status: "INFO", infoMsg:'Data Source Controller started.'});


    for (let i = 3; i < process.argv.length; i++)  {
      try {
        let dataSourceConfigFileContents = fs.readFileSync(baseDir + '/config/datasources/' + process.argv[i] + ".json").toString();
        let dataSourceConfig = JSON.parse(dataSourceConfigFileContents);
        let dsName = dataSourceConfig.name;
        process.send({status: "VERBOSE", infoMsg:'Starting Data Source thread for ' + dsName});
        let worker = cluster.fork();
        dsWorkers[dsName] = worker;
        let dsStartupCommand = {DSConfiguration: dataSourceConfig};
        worker.send(dsStartupCommand);
      }
      catch (e) {
        process.send({status: "ERROR", errorDetails: e});
      }
    }

  cluster.on('message', function(worker, message, handle) {
     process.send(message);  // relay message from child to parent process
  });

  // handle command message from parent controller process
  process.on('message', (msg) => {
    process.send({status: 'DEBUG', infoMsg: 'Data source controller received message: ' + JSON.stringify(msg) + ' Relaying to child ...' } );
    if (msg.deactivateDataSource) {
        dsWorkers[msg.deactivateDataSource].send({stopWorker: true});
    }
    if (msg.activateDataSource) {
        dsWorkers[msg.activateDataSource].send({startWorker: true});
    }
  });


/** DATA SOURCE WRAPPER */
} else if (cluster.isWorker) {
   dataSourceRedisConnection = new RedisClient();


  process.on('message', (msg) => {

    if (msg.DSConfiguration) {
      var dataSourceConfiguration = msg.DSConfiguration;

      process.title = `Integration-Node DataSource Wrapper (${dataSourceConfiguration.name})`;

      // add worker id and insert data source data into DB
      dataSourceConfiguration.worker = cluster.worker.id;
      var dataSourceData = JSON.stringify(dataSourceConfiguration);
      dataSourceRedisConnection.hset("int-node::datasources", dataSourceConfiguration.name, dataSourceData).catch((err) => {console.log(err);});
      //
      //  load and execute different data source depending on type
      //
       dataSourceRedisConnection.hget("int-node::globals", "baseDir")
        .then(function (baseDir) {
           let dataSourceModule = baseDir + '/lib/datasources/' + (dataSourceConfiguration.type).toLowerCase() +'.js';
           process.send(process.title + ' will run ' + dataSourceModule);
           runDataSource(dataSourceModule, dataSourceConfiguration);
        })
        .catch((err) => {console.log(err); throw err;});
    }

    if (msg.stopWorker) {
      process.send({status: 'DEBUG', infoMsg: 'Stopping data source worker #' + cluster.worker.id } );
      dataSourceObject.stop();
    }

    if (msg.startWorker) {
      process.send({status: 'DEBUG', infoMsg: 'Starting data source worker #' + cluster.worker.id } );
      dataSourceObject.start();
    }

  });

}

/** Instantiate and run Data Source Plugin */
function runDataSource(dsModule, config) {
  dataSourceObject = new (require(dsModule))(config);
}

