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
//  integration-node/lib/redis-client.js
//
//  This module encapsulates tha standard Redis client use by the Integration Node instance
//

const redis = require("redis");


module.exports = RedisClient;


function RedisClient(options)  {

    this._client = redis.createClient("/tmp/redis.sock", options);
    this._client.send_command("ping", function(err, reply) {
      if ((err) || reply !== 'PONG' ) throw `Could not connect to Redis: err=${err} reply=${reply}`;
     });

}

RedisClient.prototype.ping = function () {
  var promise = new Promise( (resolve, reject) => {
    this._client.send_command("ping", (err, reply) => {
      if ((err) || reply !== 'PONG' )  {
        reject (`Redis DB is not responding: err=${err} reply=${reply}`);
      }
      else {
        resolve();
      }
   });
  });
  return promise;
}


RedisClient.prototype.set = function (key, val, expiration) {
  var promise = new Promise( (resolve, reject) => {
    if (expiration) {
      this._client.setex(key, expiration, val, (err, reply) => {
        if ((err) || reply !== 'OK' )  {
          reject (`Redis SET operation failed: err=${err} reply=${reply}`);
        }
        else {
          resolve();
        }
      });
    }
    else {
            this._client.set(key, val, (err, reply) => {
        if ((err) || reply !== 'OK' )  {
          reject (`Redis SET operation failed: err=${err} reply=${reply}`);
        }
        else {
          resolve();
        }
      });
    }
  });
  return promise;
}


RedisClient.prototype.get = function (key) {
  var promise = new Promise( (resolve, reject) => {
    this._client.get(key, (err, reply) => {
      if (err)  {
        reject (`Redis GET operation failed: err=${err}`);
      }
      else {
        resolve(reply);
      }
   });
  });
  return promise;
}

RedisClient.prototype.disconnect = function () {
   this._client.quit();
}

