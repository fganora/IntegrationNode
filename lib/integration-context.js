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

const uuid = require('node-uuid');
const RedisClient = require('./redis-client.js');



/** create common Redis client */
var redisConnection = new RedisClient();


/**
//  @module IntegrationContext
//  integration-node/lib/integration-context.js
//
//  This module manages the Integration Context lifecycle
*/
var IntegrationContext = {

  /** returns a Promise for the new context object */
  create: function(integrationName) {
    var promise = new Promise( (resolve, reject) => {
      redisConnection.hget('int-node::integrations', integrationName)
        .then ( function (integrConfigJson) {
          let igConfig = JSON.parse(integrConfigJson);
          let ctx = new Context(integrationName);
          ctx.dataSource = igConfig.dataSource;
          ctx.type = igConfig.type;
          resolve (ctx);
        })
        .catch ( function (err) {
          reject( Error (`Failed to read metadata for integration ${integrationName} from Redis DB`) ) ;
        });
    });
    return promise;
  }



}


module.exports = IntegrationContext;

/**
//  Private class Context
*/

function Context(integrationName, stage) {
    this.contextID = uuid.v4();
    this.integrationName = integrationName;
    this.stage = (stage) ? stage : 'START';
    this.properties = {};
}

