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
const commandLineArgs = require('command-line-args');


//
// command-line option definitions:
//
const optionDefinitions = [
  { name: 'env', type: String, defaultOption: 'development' },
  { name: 'socket', type: Number, defaultOption: "/tmp/redis.sock" },
  { name: 'redis-port', type: Number, defaultOption: 6379},
  { name: 'redis-db', type: Number, defaultOption: 0},
  { name: 'log-level', type: String, defaultOption: 'info' },
];


/**
//  integration-node/lib/options.js
//
//  Responsibility of the Options object is to retrun the configuration
//  merging three sources (in order or incresing priority):
//  1. general defaults
//  2. configuration from integration-node/config/int-node.json
//  3. command-line arguments
*/
function Options(argv, instanceLogger) {
  var opts = commandLineArgs(optionDefinitions);
  return opts;
}

module.exports = Options;
