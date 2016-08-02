'use strict';




var RedisClient = require('../lib/redis-client.js');

var redisConnection = new RedisClient();


// ping
// console.log('Ping test:');
// redisConnection.ping()
//   .then (function (result) {
//       return ('--- ' + result + ' ---');
//   })
//   .catch (function (err) {
//       console.log('Redis PING failed!');
//   })
//   .then (function (result) {
//       console.log(result);
//   });


// insert and check value
console.log('set/get/del test:');
redisConnection.set('MyKey', 'MyValue')
  .then (function (result) {
    console.log('result=' + result);
    return redisConnection.get('MyKey')
  })
   .then (function (result) {
    console.log('result=' + result);
    return redisConnection.del('MyKey')
  })
  .then (function (result) {
    console.log('result=' + result);
    return redisConnection.get('MyKey')
  })
 .then (function (result) {
    console.log('result=' + result);
    redisConnection.disconnect();
    console.log('Redis connection closed');
  })


