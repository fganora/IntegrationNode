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

// print env
const environment = process.env.NODE_ENV || 'development'
console.log("Environment = " + environment);

// get options
var  options = require('./lib/options')(process.argv);

console.log("2. command-line options: " + JSON.stringify(options));

// startIntegration-Node  controller
var  controller = require('./lib/controller')(options);

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
