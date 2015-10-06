/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

var render = require('./lib/render');
var Router = require('koa-router');
var koaJsonLogger = require('koa-json-logger');
var session = require('koa-session');
var flash = require('koa-flash');
var koaPg = require('koa-pg');
var parse = require('co-body');
var koa = require('koa');
var app = koa();

var csrf = require('koa-csrf');

const DEFAULT_PORT = 8767;
var port = process.env.PORT || DEFAULT_PORT;

var router = new Router();
var secureRouter = new Router();

// "database"

// var posts = [];

// middleware
//
app.use(koaPg('postgres://mmo:aSddoT@localhost:5432/mmo'));
//

// var korm = new Korm(app, {
//     conn: 'postgres://site:aSddoT1(92@localhost:5432/site'
// })

app.keys = process.env.APP_KEYS || 'test,lol';
app.keys = app.keys.split(',');
app.use(session(app));
csrf(app);
// app.use(csrf.middleware);
app.use(flash());

app.use(koaJsonLogger({
    name: 'aaleks.ru',
    path: '/var/log/aaleks'
}));

if (process.env.NODE_ENV === 'development') {
    var serve = require('koa-static');
    app.use(serve(`${__dirname}/../static/public/`, {maxage: 65356}));
}

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
    if (this.status >= 400 && this.status < 500) {
        this.body = yield render('error', {requestedPath: this.request.path, status: this.status});
    }
});

/**
 * Auth middlevare
 */

function *checkAuth(next) {
    /*jshint validthis:true */
    if (this.session.user) {
        yield next;
    } else {
        this.redirect(router.url('login'));
    }
}


/**
 * App routes
 */
secureRouter.use(checkAuth);

function *index() {
    /*jshint validthis:true */
    this.body = yield render('index', {user: this.session.user, flash: this.flash});
}

function *login() {
    /*jshint validthis:true */
    if (this.session.user) {
        this.redirect(secureRouter.url('dashboard'));
    }

    this.body = yield render('admin/login', {csrf: this.csrf, flash: this.flash});
}

function *logoff(next) {
    /*jshint validthis:true */
    this.session = null;
    this.redirect(router.url('index'));
    yield next;
}

function *dashboard() {
    /*jshint validthis:true */
    this.body = yield render('admin/dashboard', {user: this.session.user});
}

function *authorize() {
    /*jshint validthis:true */
    var body = yield parse(this);
    console.log(body);
    this.assertCSRF(body);

    if (body.login && body.password === 'password') {
        this.session.user = {
            login: body.login,
            hasAuth: true
        };
        this.redirect(secureRouter.url('dashboard'));
    } else {
        delete body.password;
        delete body._csrf;
        this.flash = {error: 'Wrong username or password', oldForm: body};
        this.redirect(router.url('login'));
    }
}

router.get('index', '/', index);
router.get('login', '/login', login);
secureRouter.get('dashboard', '/admin/dashboard', dashboard);

router.post('/login', authorize);
secureRouter.post('logoff', '/logoff', logoff);

require('./routes/notes')({router, secureRouter, render});

app.use(router.routes());
app.use(secureRouter.routes());

app.listen(port);
console.log(`listening on port ${port}`);
