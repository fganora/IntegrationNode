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
*  Global Integration-Node variables
*  integration-node/lib/globals.js
*
*  This source holds global variable shared across the main module and the controller module
*/
var globals = {

    baseDir: '',                // base directory of Integration-Node installation

    environment: '',            // environment identifier

    controllerPort: '',         // HTTP port the Controller UI listens to

    redisSocket: '',            // Redis DB socket the instance connects to

    redisDb: '',                // Redis DB instance (default 0) the instance connects to

    logLevel: '',               // Current level of the instance

    instanceConfiguration: {},  // configuration object for the instance

    instanceLogger: {},         // logger object for the instance

    instanceRedisConnection: {} // Redis connection object for the instance

}

module.exports = globals;
