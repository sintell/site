/*jshint node:true*/
/*jshint esnext:true*/
/*jshint noyield: true*/
'use strict';

const renderer = require('./lib/render');
const Router = require('koa-router');
const koaJsonLogger = require('koa-json-logger');
const session = require('koa-session');
const flash = require('koa-flash');
const koaPg = require('koa-pg');
const bodyParser = require('koa-bodyparser');
const koa = require('koa');
const app = koa();

const csrf = require('koa-csrf');

const DEFAULT_PORT = 8767;
const port = process.env.PORT || DEFAULT_PORT;

const router = new Router();
const secureRouter = new Router();
const passport = require('./lib/auth');

app.keys = [process.env.APP_KEYS || 'new keys lol'];

app.use(bodyParser({
    onerror: function(err, ctx) {
        ctx.throw('body parse error', 422);
    }
}));

// database
app.use(koaPg('postgres://mmo:aSddoT@localhost:5432/mmo'));

app.use(session(app));
app.use(passport.initialize());
app.use(passport.session());
csrf(app);
app.use(csrf.middleware);
app.use(flash());

app.use(renderer());

app.use(koaJsonLogger({
    name: 'aaleks.ru',
    path: '/var/log/aaleks'
}));

if (process.env.NODE_ENV === 'development') {
    var serve = require('koa-static');
    app.use(serve(`${__dirname}/../static/public/`, {maxage: 65356}));
}

/**
 * Errors middleware
 */

app.use(function *errors500(next) {
    try {
        yield next;
    } catch (err) {
        this.status = err.status || 500;
        this.body = yield this.render('error', {msg: err.message, status: this.status});
        this.app.emit('error', err, this);
    }
});

app.use(function *errors400(next) {
    yield next;
    if (this.status >= 400 && this.status < 500) {
        this.body = yield this.render('error', {requestedPath: this.request.path, status: this.status});
    }
});

/**
 * Auth middlevare
 */

function *checkAuth(next) {
    /*jshint validthis:true */
    if (this.req.isAuthenticated()) {
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
    var noteData = yield this.pg.db.client.query_(
        `SELECT title, text FROM notes
            WHERE at_main_page=true AND (deleted_at IS NULL OR deleted_at > now())
         ORDER BY updated_at DESC
         LIMIT 1;`
    );

    this.body = yield this.render('index', {note: noteData.rows[0]});
}

function *login() {
    /*jshint validthis:true */
    if (this.session.user) {
        this.redirect(secureRouter.url('dashboard'));
    }
    this.body = yield this.render('admin/login');
}

function *logoff() {
    /*jshint validthis:true */
    this.logout();
    this.redirect('/');
}

function *authorize() {
    /*jshint validthis:true */
    var body = this.request.body;
    this.assertCSRF(body);

    yield passport.authenticate('local', {
        successRedirect: secureRouter.url('dashboard'),
        failureRedirect: router.url('login')
    });
}

function *dashboard() {
    /*jshint validthis:true */
    this.body = yield this.render('admin/dashboard');
}

// Configure /auth/github & /auth/github/callback
router.get('/auth/github', passport.authenticate('github'));
router.get(
    '/auth/github/callback',
    passport.authenticate('github', {successRedirect: '/', failureRedirect: '/', failureFlash: true})
);

router.get('index', '/', index);
router.get('login', '/login', login);
secureRouter.get('dashboard', '/admin/dashboard', dashboard);

router.post('/login', authorize);
secureRouter.post('logout', '/logout', logoff);

require('./routes/notes')({router, secureRouter});

app.use(router.routes());
app.use(secureRouter.routes());

app.listen(port);
console.log(`listening on port ${port}`);
