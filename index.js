/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

var forever = require('forever-monitor');

var child = new (forever.Monitor)('server/index.js', {
    max: 3,
    silent: true,
    args: []
});

child.on('exit', function() {
    console.log('server/index.js has exited after 3 restarts');
});

child.start();
