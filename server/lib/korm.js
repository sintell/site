/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

var kpg = require('koa-pg');

var Korm = function(app, options) {
    if (!options.conn) {
        throw new Error('No connection string for korm :(');
    }

    app.use(kpg(options.conn));
    this.c = app.g.db.client;

    this.models = [];

    return this;
};

Korm.prototype.register = function(name, dataStruct) {
    this.models[name] = dataStruct;
    var result = this.c.query_('SELECT now()');
};

module.exports = Korm;