/*
Copyright (c) 2016-2016 Francesco Ganota, http://francescoganora.com
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

const fs = require('fs');
const nconf = require('nconf');



// load instance configuration and merge command line options
var instanceConfigFile = __dirname + '/config/integration-node-config.json';  // default config file

// config file specified
if (process.argv[2] && !process.argv[2].startsWith('--')) {
  try {
        fs.accessSync(process.argv[2]);
  }
  catch (e) {
    console.error('Specified instance configuration file ' + process.argv[2] + ' not found or not readable. Integration-Node instance must abort.' );
    console.error('Original error is:');
    console.error(e);
    process.exit(1);
  }
  instanceConfigFile = process.argv[2];
}

// validate confif file
try {
  let configFileContents = fs.readFileSync(instanceConfigFile);
  JSON.parse(configFileContents);
}
catch (e) {
  console.error('Instance configuration file ' + instanceConfigFile + ' is not a valid JSON file. Integration-Node instance must abort.' );
  console.error('Original error is:');
  console.error(e);
  process.exit(1);

}

nconf.add('INSTANCE', { type: 'file', file: instanceConfigFile });

var instanceConfiguration = nconf.get();
var cmdLineOptions = require('./lib/options')(process.argv);
for ( var opt in cmdLineOptions) {
  instanceConfiguration[opt] = cmdLineOptions[opt];
}

console.log("Command-line options: " + JSON.stringify(instanceConfiguration));

// save options (TEST)
// nconf.save(function (err) {});




// startIntegration-Node  controller
var  controller = require('./lib/controller')(instanceConfiguration, __dirname);

//
// graceful shutdown
//
process.on('SIGINT', () => {
  console.log('Integration-Node instance now exiting...');
  process.exit();
});

process.on('exit', (code) => {
  console.log(`Integration-Node instance exited with return code ${code}`);
});
