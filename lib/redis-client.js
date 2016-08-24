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


/**
 * Module dependencies
 */
const redis = require("redis");

/**
 * RedisClient module.
 * @module ./lib/redis-client.js
 */
module.exports = RedisClient;


/**
* encapsulates tha standard Redis client use by the Integration Node instance
*
* @param {Object} options optional paramters for Redis connection (see documentation of 'redis' package)
*/
function RedisClient(options)  {

    this._client = redis.createClient("/tmp/redis.sock", options);
    this._client.send_command("ping", function(err, reply) {
      if ((err) || reply !== 'PONG' ) throw `Could not connect to Redis: err=${err} reply=${reply}`;
     });

}

/** return the reference to the connection */
RedisClient.prototype.getConnection = function () {
   return (this._client);
}

/** disconnects the connection to Redis */
RedisClient.prototype.disconnect = function () {
   this._client.quit();
}

/** calls the Redis PING command (see http://redis.io/commands/ping)
*
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.ping = function () {
  var promise = new Promise( (resolve, reject) => {
    this._client.send_command("ping", (err, reply) => {
      if ((err) || reply !== 'PONG' )  {
        reject (Error(`Redis DB is not responding to PING: err=${err} reply=${reply}`));
      }
      else {
        resolve(reply);
      }
   });
  });
  return promise;
}


/** calls the Redis SET command (see http://redis.io/commands/set)
*
* @param (String} key  key to insert/update into DB
* @param (String} val  value to set in DB for key
* @param {String=} expiration  optional key expiration value in seconds
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.set = function (key, val, expiration) {
  var promise = new Promise( (resolve, reject) => {
    if (expiration) {
      this._client.setex(key, expiration, val, (err, reply) => {
        if ((err) || reply !== 'OK' )  {
          reject (Error(`Redis SET operation failed: err=${err} reply=${reply}`));
        }
        else {
          resolve(reply);
        }
      });
    }
    else {
            this._client.set(key, val, (err, reply) => {
        if ((err) || reply !== 'OK' )  {
          reject (Error(`Redis SET operation failed: err=${err} reply=${reply}`));
        }
        else {
          resolve(reply);
        }
      });
    }
  });
  return promise;
}


/** calls the Redis GET command (see http://redis.io/commands/get)
*
* @param (String} key  key to search in DB
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.get = function (key) {
  var promise = new Promise( (resolve, reject) => {
    this._client.get(key, (err, reply) => {
      if (err)  {
        reject (Error(`Redis GET operation failed: err=${err}`));
      }
      else {
        resolve(reply);
      }
   });
  });
  return promise;
}


/** calls the Redis DEL command (see http://redis.io/commands/del)
*
* @param (String} key  key to delete from DB
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.del = function (key) {
  var promise = new Promise( (resolve, reject) => {
    this._client.del(key, (err, reply) => {
      if (err)  {
        reject (Error(`Redis DEL operation failed: err=${err}`));
      }
      else {
        resolve(reply);
      }
   });
  });
  return promise;
}


/** calls the Redis HSET command (see http://redis.io/commands/hset)
*
* @param (String} key  hash set key
* @param (String} fld  hash set field to set
* @param {String} val  value to be assigned for hash set field
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.hset = function (key, fld, val) {
  var promise = new Promise( (resolve, reject) => {
    this._client.hset(key, fld, val, (err, reply) => {
      if (err)  {
          reject (Error(`Redis HSET operation failed: err=${err}`));
      }
      else {
        resolve(reply);
      }
    });
  });
  return promise;
}


/** calls the Redis HMSET command (see http://redis.io/commands/hmset)
*
* @param (String} key  hash set key
* @param (Object} obj  obbject with key/value pairs for all fields to be assigned
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.hmset = function (key, obj) {
  var promise = new Promise( (resolve, reject) => {
    this._client.hmset(key, obj, (err, reply) => {
      if (err)  {
          reject (Error(`Redis HSET operation failed: err=${err}`));
      }
      else {
        resolve(reply);
      }
    });
  });
  return promise;
}


/** calls the Redis HGET command (see http://redis.io/commands/hget)
*
* @param (String} key  hash set key
* @param (String} fld  hash set field to retrieve
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.hget = function (key, fld) {
  var promise = new Promise( (resolve, reject) => {
    this._client.hget(key, fld, (err, reply) => {
      if (err)  {
          reject (Error(`Redis HGET operation failed: err=${err}`));
      }
      else {
        resolve(reply);
      }
    });
  });
  return promise;
}


/** calls the Redis HKEYS command (see http://redis.io/commands/hkeys)
*
* @param (String} key  hash set key
* @returns {Object} promise  promise object for command reply value
*/
RedisClient.prototype.hkeys = function (key) {
  var promise = new Promise( (resolve, reject) => {
    this._client.hkeys(key, (err, reply) => {
      if (err)  {
          reject (Error(`Redis HKEYS operation failed: err=${err}`));
      }
      else {
        resolve(reply);
      }
    });
  });
  return promise;
}


