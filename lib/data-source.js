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
//  integration-node/lib/data-source.js
//
//  This creates the Integration-Node data source processes according to configuration
//

const cluster = require('cluster');
const express = require('express');
const fs =require('fs');
const RedisClient = require('./redis-client.js');


var baseDir;
var dataSourceRedisConnection;

if (cluster.isMaster) {  // DATA SOURCE CONTROLLER


    process.title = "Integration-Node DataSource Controller";
    baseDir = process.argv[2];
    process.send({status: "INFO", infoMsg:'Data Source Controller started.'});


    for (let i = 3; i < process.argv.length; i++)  {
      try {
        let dataSourceConfigFileContents = fs.readFileSync(baseDir + '/config/datasources/' + process.argv[i] + ".json").toString();
        let dataSourceConfig = JSON.parse(dataSourceConfigFileContents);
        process.send({status: "VERBOSE", infoMsg:'Starting Data Source ' + process.argv[i]});
        let worker = cluster.fork();
        worker.send(dataSourceConfigFileContents);
      }
      catch (e) {
        process.send({status: "ERROR", errorDetails: e});
      }
      // console.log(cluster.workers);
    }

  cluster.on('message', function(worker, message, handle) {
    process.send({status: "INFO", infoMsg: message});

  });


} else if (cluster.isWorker) {  // DATA SOURCE WRAPPER
   dataSourceRedisConnection = new RedisClient();


  process.on('message', (msg) => {
    var dataSourceConfiguration = JSON.parse(msg);

    process.title = `Integration-Node DataSource Wrapper (${dataSourceConfiguration.name})`;

    // add worker id and insert data source data into DB
    dataSourceConfiguration.worker = cluster.worker.id;
    var dataSourceData = JSON.stringify(dataSourceConfiguration);
    dataSourceRedisConnection.hset("int-node:datasources", dataSourceConfiguration.name, dataSourceData).catch((err) => {console.log(err);});




     //
     //  START -- TO BE MADE GENERIC
     //

    var httpDataSource = express();
    httpDataSource.get( "/" ,  function(req,res) {
        res.type('text/plain');
        res.send(dataSourceConfiguration.name);
    });

    httpDataSource.listen(dataSourceConfiguration.config.port, () => {
       process.send(`Data Source ${dataSourceConfiguration.name} started, listening on port ${dataSourceConfiguration.config.port}`);
    });
    //
     //  END -- TO BE MADE GENERIC
     //

  });

}


