/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

/**
 * Module dependencies.
 */

var views = require('co-views');

var Renderer = function(options) {
    // setup views mapping .html
    // to the swig template engine

    var render = views(__dirname + '/../views', {
        map: {html: 'swig'}
    });

    return function(name, data) {
        return render(name, Object.assign({}, data, options.proxy));
    };
};

module.exports = function(options) {
    // inject common params into render call
    return function *renderInject(next) {
        this.render = new Renderer({proxy: {user: this.passport.user, flash: this.flash, csrf: this.csrf}});
        yield next;
    };
};
