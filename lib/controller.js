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

// imports
const express = require('express');


//
//  integration-node/lib/controller.js
//
//  This creates the Integration-Node controller process
//


function Controller(options) {
  var controller = express();

  controller.set('port', options.port || 3000);


  // 404 page
  controller.use( function notFound(req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
  });

   // 500 page
  controller.use( function notFound(err, req, res, next) {
    res.type('text/plain');
    res.status(504);
    res.send('500 - Server Error');
  });

      var controllerServer = controller.listen(controller.get('port'), function afterControllerStart() {
      var host = controllerServer.address().address;
      var port = controllerServer.address().port;
    console.log('Integration-Node controller started http://%s:%s ', host, port);
    console.log('Type ctrl-C to quit');
  })

  return controller;
}

module.exports = Controller;
