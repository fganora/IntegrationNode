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


'use strict';

/**
 * Module dependencies
 */
const winston = require('winston');
const moment = require('moment');



/**
 * Logger module.
 * @module ./lib/logger.js
 */
module.exports = Logger;

/**
* Instantiates a Winston logger
*
* @param {String} loggerType   the type of logger ('INTANCE', 'DATASOURCE' or 'INTEGATATION')
* @param {String} baseDir   the IntegrationNode root installation directory
* @param {String} objectName name of data source or integratin
*/
function Logger (loggerType, baseDir, objectName) {
  var transportArray;
  var dateStamp = moment().format('YYYY-MM-DD');


  switch(loggerType) {
    case 'INSTANCE':
      transportArray = [  new (winston.transports.Console)({colorize: true}),
                          new (winston.transports.File)({ filename: baseDir + '/logs/instance/INSTANCE-' + dateStamp + '.log' })
                      ];
      break;
      case 'DATASOURCE':
      transportArray = [
                          new (winston.transports.File)({ filename: baseDir + '/logs/datasource/' + objectName + '-' + dateStamp + '.log' })
                      ];
      break;
      case 'INTEGRATION':
      transportArray = [
                          new (winston.transports.File)({ filename: baseDir + '/logs/integration/' + objectName + '-' + dateStamp + '.log' })
                      ];
      break;
  }

  this.logger = new (winston.Logger) ({transports:  transportArray});
  this.level = 'info';
  this.logger.level = this.level;
}

/**
* Sets the loging level
*
* @param level  logging level
*/
Logger.prototype.setLevel = function (level) {
  if (['error', 'warn', 'info', 'verbose', 'debug'].indexOf(level) === -1) {
     throw `Invalid logging level '${level}'`;
  }
  this.level = level;
  this.logger.level = level;
}


/**
* Logs an error
*
* @param message  error message
* @param {...parms} parms   message placeholders
*/
Logger.prototype.error = function (message, ...parms) {
  var tS = new Date;
  message = `${tS.getFullYear()}-${tS.getMonth()+1}-${tS.getDate()}T${tS.getHours()}:${tS.getMinutes()}:${tS.getSeconds()}.${tS.getMilliseconds()} --- ` + message;

  this.logger.error(message, ...parms);
}

/**
* Logs a warning
*
* @param message  warning message
* @param {...parms} parms   message placeholders
*/
Logger.prototype.warn = function (message, ...parms) {
  var tS = new Date;
  message = `${tS.getFullYear()}-${tS.getMonth()+1}-${tS.getDate()}T${tS.getHours()}:${tS.getMinutes()}:${tS.getSeconds()}.${tS.getMilliseconds()} --- ` + message;

  this.logger.warn(message, ...parms);
}

/**
* Logs an informational message
*
* @param message  informational message
* @param {...parms} parms   message placeholders
*/
Logger.prototype.info = function (message, ...parms) {
  var tS = new Date;
  message = `${tS.getFullYear()}-${tS.getMonth()+1}-${tS.getDate()}T${tS.getHours()}:${tS.getMinutes()}:${tS.getSeconds()}.${tS.getMilliseconds()} --- ` + message;

  this.logger.info(message, ...parms);
}

/**
* Logs a verbose informational message
*
* @param message  verbose informational message
* @param {...parms} parms   message placeholders
*/
Logger.prototype.verbose = function (message, ...parms) {
  var tS = new Date;
  message = `${tS.getFullYear()}-${tS.getMonth()+1}-${tS.getDate()}T${tS.getHours()}:${tS.getMinutes()}:${tS.getSeconds()}.${tS.getMilliseconds()} --- ` + message;

  this.logger.verbose(message, ...parms);
}


/**
* Logs a debugging message
*
* @param message  debugging message
* @param {...parms} parms   message placeholders
*/
Logger.prototype.debug = function (message, ...parms) {
  var tS = new Date;
  message = `${tS.getFullYear()}-${tS.getMonth()+1}-${tS.getDate()}T${tS.getHours()}:${tS.getMinutes()}:${tS.getSeconds()}.${tS.getMilliseconds()} --- ` + message;

  this.logger.debug(message, ...parms);
}
Logger.prototype.debug = function (message, sourceFile, ...parms) {
  var tS = new Date;
  message = `${tS.getFullYear()}-${tS.getMonth()+1}-${tS.getDate()}T${tS.getHours()}:${tS.getMinutes()}:${tS.getSeconds()}.${tS.getMilliseconds()} --- ` + message;

  this.logger.debug(message, ...parms);
}



