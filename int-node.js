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


try {
  globals.baseDir = __dirname;  // int-node.js location

  // create instance logger
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

  // validate config file
  try {
    let configFileContents = fs.readFileSync(instanceConfigFile);
    JSON.parse(configFileContents);
  }
  catch (e) {
    instanceLogger.error('Instance configuration file %s is not a valid JSON file. ' +
        'Integration-Node instance must abort. Original error is: %j', process.argv[2], e );
    process.exit(1);

  }
  // log to file
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
  globals.redisSocket = instanceConfiguration['redis-socket'];
  globals.redisDb = instanceConfiguration['redis-db'];
  globals.logLevel = instanceConfiguration['log-level'];

  // set logging level
  instanceLogger.setLevel(globals.logLevel);
  instanceLogger.verbose('Instance configuration is : %j.', JSON.stringify(instanceConfiguration) );

  // connect to Redis via Socket
  var instanceRedisConnection = new RedisClient();
  globals.instanceRedisConnection = instanceRedisConnection;



  // startIntegration-Node  controller
  var  controller = require('./lib/controller')(
                                                // {instanceConfiguration: instanceConfiguration,
                                                // basedir: __dirname,
                                                // instanceLogger: instanceLogger,
                                                // instanceRedisConnection: instanceRedisConnection}
                                                );

}
catch (e) {
  instanceLogger.error('A technical error occurred. Integration-Node instance must abort. Original error is: %j', process.argv[2], e );
  process.exit(1);
}


//
// graceful shutdown
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


