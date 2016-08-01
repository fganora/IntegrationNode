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

const fs = require('fs');
const moment = require('moment');

const globals = require('./globals.js');

//
//  integration-node/lib/log-utils.js
//
//  This source contains utility functions for managing Integration-Node logs
//

var logUtils = {

  readInstanceLog:  function (date) {
    var selectionDate = date || moment();
    var logFile = globals.baseDir + '/logs/instance/INSTANCE-' + selectionDate.format('YYYY-MM-DD') + '.log';
    // console.log('logFile =' + logFile);

    var promise = new Promise ( function(resolve, reject) {

      fs.readFile(logFile, function(err, data) {
        if (err) {
          reject(err);
        }
        else {
          let logEntries = data.toString().trim().split('\n');
          resolve( logEntries.map( function(entry) {return JSON.parse(entry);} ) );
        }
      });

    });
    return promise;
  }

}


module.exports = logUtils;
