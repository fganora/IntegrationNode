'use strict';

/*
 *  Integration-Node unit tests
*/

const assert = require('chai').assert;

var RedisClient = require('../lib/redis-client.js');


/*
 *  Tests for lib/redis-client.js
*/

describe('RedisClient tests:', function() {

  var redisConnection;

  // get Redis DB connection
  before(function() {
     redisConnection = new RedisClient();
  });


  describe('ping()', function() {
    it('should return PONG', function() {
       redisConnection.ping().then(
          function (result) {
            assert.equal(result, "PANG");
            done();
          },
          function (err) {
            done(err);
          }
        );
    });
  });


  describe('set(), get() and del()', function() {
    it('set() should return "OK"', function() {
       redisConnection.set('MyKey', 'MyValue').then(
          function (result) {
            assert.equal(result, "OK");
            done();
          },
          function (err) {
            done(err);
          }
        );
    });
    it('get() should return "MyValue"', function() {
       redisConnection.get('MyKey').then(
          function (result) {
            assert.equal(result, "MyValue");
            done();
          },
          function (err) {
            done(err);
          }
        );
    });
    it('del() should return 1', function() {
       redisConnection.del('MyKey').then(
          function (result) {
            assert.equal(result, "1");
            done();
          },
          function (err) {
            done(err);
          }
        );
    });
    it('get() should now return nothing', function() {
       redisConnection.get('MyKey').then(
          function (result) {
            assert.isNull(result);
            done();
          },
          function (err) {
            done(err);
          }
        );
    });
  });



  after(function() {
     redisConnection.disconnect();
  });

});
