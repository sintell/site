/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

const passport = require('koa-passport');
const GithubStrategy = require('passport-github').Strategy;
const LocalStrategy = require('passport-local').Strategy;

var User = function(data) {
    return data;
};

passport.use(new GithubStrategy({
    clientID: [process.env.GH_CLIENT_ID],
    clientSecret: [process.env.GH_CLIENT_SECRET],
    callbackURL: 'http://87.228.113.28:8767/auth/github/callback'
},
// Based on profile return from Github, find existing user
// Return user model
function(accessToken, refreshToken, profile, done) {
    let user = profile;
    console.log(profile);
    return done(null, user);
}));

passport.use(new LocalStrategy(function(username, password, done) {
    if (username !== '' && password === 'password') {
        var user = {username: username, hasAuth: true, email: `${username}@email.org`};

        done(null, user);
    } else {
        done(null, false);
    }
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
