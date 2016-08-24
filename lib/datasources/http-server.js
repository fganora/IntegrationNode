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

module.exports = DataSource;

/**
* HTTP-SERVER Data Source Plugin
* This implements a HTTP data source using Express
*
* @param {Object} dsConfig  data source configuration object
*/
function DataSource (dsConfig, dsLogger) {
    this.configuration = dsConfig;
    this.logger = dsLogger;
    this.httpDataSource = express();
    this.httpServer = null;

    this.logger.info('>>>');
    this.logger.info(`Starting up data source ${this.configuration.name} ...`);

    // request datasource route return config
    this.httpDataSource.get( "/" ,  function(req,res) {
        res.type('application/json');
        res.send(JSON.stringify(dsConfig));
    });

    for (var i = 0; i < this.configuration.triggers.length; i++) {
      let trg = this.configuration.triggers[i];
      switch (trg.triggerConfig.method)   {

        case 'GET':
          this.httpDataSource.get( trg.triggerConfig.path ,  function(req,res) {
            handleRequest(req, res, trg, dsLogger);
          });
          break;

          case 'POST':
          this.httpDataSource.post( trg.triggerConfig.path ,  function(req,res) {
                handleRequest(req, res, trg, dsLogger);
          });
          break;

          case 'PUT':
          this.httpDataSource.put( trg.triggerConfig.path ,  function(req,res) {
                handleRequest(req, res, trg, dsLogger);
          });
          break;

          case 'DELETE':
          this.httpDataSource.delete( trg.triggerConfig.path ,  function(req,res) {
                handleRequest(req, res, trg, dsLogger);
          });
          break;
      }

    };

     // default route
    this.httpDataSource.get( "/*" ,  function(req,res) {

        if (dsConfig.logUnmatchedEvents) {
            dsLogger.verbose(`Received unmatched request from IP ${req.ip} with method=${req.method} path=${req.path}`)
        }

        res.type('application/json');
        res.send({"error": "Unmatched request"});
    });

    this.logger.info('Routes created');

    if (dsConfig.active) {
      this.start();
    }
}



/**
//  Start the Express server
*/
DataSource.prototype.start = function () {
  process.send( {status: "VERBOSE", infoMsg: `Data source ${this.configuration.name} starting with configuration: `
    + JSON.stringify(this.configuration) });
  this.httpServer = this.httpDataSource.listen(this.configuration.config.port, () => {
      process.send({status: "INFO", infoMsg: `Data source ${this.configuration.name} started, ` +
                      `listening on ${this.configuration.config.protocol} port ${this.configuration.config.port}.` });
  });
  this.logger.info('Datasource started');
}

/**
//  Stop the Express server
*/
DataSource.prototype.stop = function () {
  this.httpServer.close(() => {
      process.send({status: "INFO", infoMsg: `Data source ${this.configuration.name} stopped.` });
      this.logger.info('Datasource stopped');
  });
}


/**
//  Build the integration context for an HTTP request, dispatr the integration and handle the response
//
*/
function handleRequest (req, res, trg, dsLogger) {

  dsLogger.verbose(`Received request from  IP ${req.ip} with method=${req.method} path=${req.path} integration=${trg.integration}`)
  res.type('application/json');
  res.send(`{ "method" : "${req.method}", "path" : "${req.path}", "integration": "${trg.integration}" }`);
}
