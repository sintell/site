/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

var render = require('./lib/render');
var route = require('koa-route');
var serve = require('koa-static');
var koaJsonLogger = require('koa-json-logger');

// var parse = require('co-body');
var koa = require('koa');
var app = koa();

const DEFAULT_PORT = 8767;
var port = process.env.PORT || DEFAULT_PORT;

// "database"

// var posts = [];

// middleware
app.use(koaJsonLogger({
    name: 'aaleks.ru',
    path: '/var/log/aaleks'
}));

// errors middleware
app.use(function*(next) {
    try {
        yield next;
    } catch (err) {
        this.status = err.status || 500;
        this.body = yield render('error', {msg: err.message, status: this.status});
        this.app.emit('error', err, this);
    }
});

app.use(function* (next) {
    yield next;
    if (this.status === 404) {
        this.body = yield render('error', {msg: 'Sorry, but nothin\' is here.', status: this.status});
    }
});

if (process.env.NODE_ENV === 'development') {
    app.use(serve(`${__dirname}/../static/public`, {maxage: 65356}));
}

/**
 * Post listing.
 */

// route definitions
function *index() {
    this.body = yield render('index');
}

// route middleware
app.use(route.get('/', index));

app.listen(port);
console.log(`listening on port ${port}`);
