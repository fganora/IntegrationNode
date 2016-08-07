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


/**
//  HTTP-SERVER Data Source Plugin
//  integration-node/lib//datasources/http-server.js
//
//  This implements a HTTP data source using Express
*/
function DataSource (dsConfig) {
    this.configuration = dsConfig;
    this.httpDataSource = express();
    this.httpServer = null;

    this.httpDataSource.get( "/" ,  function(req,res) {
        res.type('text/plain');
        res.send('Hello World!');
    });
    if (dsConfig.active) {
      this.start();
    }
}


DataSource.prototype.start = function () {
  process.send( {status: "VERBOSE", infoMsg: `Data source ${this.configuration.name} starting with configuration: `
    + JSON.stringify(this.configuration) });
  this.httpServer = this.httpDataSource.listen(this.configuration.config.port, () => {
      process.send({status: "INFO", infoMsg: `Data source ${this.configuration.name} started, ` +
                      `listening on ${this.configuration.config.protocol} port ${this.configuration.config.port}.` });
  });
}

DataSource.prototype.stop = function () {
  this.httpServer.close(() => {
      process.send({status: "INFO", infoMsg: `Data source ${this.configuration.name} stopped.` });
  });
}

module.exports = DataSource;
