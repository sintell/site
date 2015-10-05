/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

const passport = require('koa-passport');
const GithubStrategy = require('passport-github').Strategy;

passport.use(new GithubStrategy({
    clientID: [process.env.GH_CLIENT_ID],
    clientSecret: [process.env.GH_CLIENT_SECRET],
    callbackURL: 'http://aaleks.ru/auth/github/callback'
},
// Based on profile return from Github, find existing user
// Return user model
function(accessToken, refreshToken, profile, done) {
    let user = profile;
    console.log(profile);
    return done(null, user);
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// var passport = require('koa-passport');

// var user = {id: 1, username: 'test'};

// passport.serializeUser(function(user, done) {
//     done(null, user.id);
// });

// passport.deserializeUser(function(id, done) {
//     done(null, user);
// });

// var LocalStrategy = require('passport-local').Strategy;

// passport.use(new LocalStrategy(function(username, password, done) {
//     // retrieve user ...
//     if (username === 'test' && password === 'test') {
//         done(null, user);
//     } else {
//         done(null, false);
//     }
// }));

module.exports = passport;
