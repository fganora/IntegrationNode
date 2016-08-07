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

// imports
const fs = require('fs');
const nconf = require('nconf');

const globals = require('./lib/globals.js');
const Logger = require('./lib/logger.js');
const RedisClient = require('./lib/redis-client.js');
const integrationConfiguration = require('./lib/integration-configuration.js')


var instanceRedisConnection;
var controller;

/**
* This is the Integration-Node main script:
* - read confguration file and command line options
* - initialize instance logging
* - assign some globals
* - create Redis DB connection
* - when Redis connection is ready save globals to DB and starts the module:controller
* - handles process termination events
*/
try {
  globals.baseDir = __dirname;  // int-node.js location

  /** create instance logger */
  var instanceLogger = new Logger('INSTANCE', globals.baseDir);
  globals.instanceLogger = instanceLogger;
  instanceLogger.info('>>>');
  instanceLogger.info('Integration-Node instance starting.');

  // load instance configuration and merge command line options
  var instanceConfigFile = globals.baseDir + '/config/integration-node-config.json';  // default config file

  // config file specified
  if (process.argv[2] && !process.argv[2].startsWith('--')) {
    try {
          fs.accessSync(process.argv[2]);
    }
    catch (e) {
      instanceLogger.error('Specified instance configuration file %s not found or not readable. ' +
        'Integration-Node instance must abort. Original error is: %j', process.argv[2], e );
      process.exit(1);
    }
    instanceConfigFile = process.argv[2];
  }

  instanceLogger.info('Instance configuration file is %s.', instanceConfigFile );

  /** validate config file */
  try {
    let configFileContents = fs.readFileSync(instanceConfigFile);
    JSON.parse(configFileContents);
  }
  catch (e) {
    instanceLogger.error('Instance configuration file %s is not a valid JSON file. ' +
        'Integration-Node instance must abort. Original error is: %j', process.argv[2], e );
    process.exit(1);

  }
  // set instance configuration source to specified config file
  nconf.add('INSTANCE', { type: 'file', file: instanceConfigFile });

  var instanceConfiguration = nconf.get();
  var cmdLineOptions = require('./lib/options')(process.argv, instanceLogger);
  for ( var opt in cmdLineOptions) {
    instanceConfiguration[opt] = cmdLineOptions[opt];
  }
  globals.instanceConfiguration = instanceConfiguration;

  // set other globals
  globals.environment = instanceConfiguration['env'];
  globals.controllerPort = instanceConfiguration['port'];
  globals.redisSocket = instanceConfiguration['socket'];
  globals.redisDb = instanceConfiguration['redis-db'];
  globals.logLevel = instanceConfiguration['log-level'];

  // set logging level
  instanceLogger.setLevel(globals.logLevel);
  console
  instanceLogger.verbose('Instance configuration is : %j.', JSON.stringify(instanceConfiguration) );

  /** connect to Redis via Socket */
  instanceRedisConnection = new RedisClient();
  globals.instanceRedisConnection = instanceRedisConnection;

  //
  //  REST OF TOP-LEVEL LOGIC IN HANDLER FOR 'ready' EVENT OF REDIS DB CONNECTION (BELOW)
  //
}
catch (e) {
  instanceLogger.error('A technical error occurred during Integration-Node startup.' +
    ' Integration-Node instance must abort. Original error is: %j', process.argv[2], e );
  process.exit(1);
}



//
// Redis DB events
//

/** start Integration-Node controller only when the DB connection is ready */
globals.instanceRedisConnection.getConnection().on('ready', function() {
   instanceLogger.info('Connected to Redis database on socket /tmp/redis.sock');
  // store globals in DB
  globals.instanceRedisConnection.hmset("int-node::globals", {baseDir: globals.baseDir,
                                                            environment: globals.environment,
                                                            controllerPort: globals.controllerPort,
                                                            redisSocket: globals.redisSocket,
                                                            redisDb: globals.redisDb,
                                                            logLevel: globals.logLevel,
                                                            instanceConfiguration: JSON.stringify(globals.instanceConfiguration)})
    .then( function() {
      // synchronously load and validate complete integration configuration
      integrationConfiguration.loadSync();

      // start Integration-Node  controller with UI
      controller = require('./lib/controller')();
    })
    .catch((err) => {
      instanceLogger.error('Redis database error. Integration-Node instance must abort. Original error is: %j', err);
      process.exit(1);
    } );


});


globals.instanceRedisConnection.getConnection().on('error', function(err) {
  instanceLogger.error('Redis database not responding on socket /tmp/redis.sock. Integration-Node instance must abort. Original error is: %j', err);
  process.exit(1);
});


//
// instance shutdown events
//
process.on('SIGINT', () => {
  instanceLogger.info('Integration-Node instance now exiting...');
  instanceRedisConnection.disconnect();
  instanceLogger.info('Disconnected from Redis DB');
  process.exit();
});

process.on('exit', (code) => {
  instanceLogger.info('Integration-Node instance exited with return code %d.', code);
});


