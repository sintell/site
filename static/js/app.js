/* jshint browser:true */
/* jshint node:true */
/* jshint esnext:true */

var App = function() {
    'use strict';

    var $ = require('jquery');
    var hljs = require('./vendor/highlight.pack.min');
    $('pre code').each(function(index, block) {
        hljs.highlightBlock(block);
    });

    var $menu = $('.App-Menu-Tiles');
    var $tiles = $('.App-Menu-Tile', $menu);

    var viewPortHeight = window.innerHeight;
    var viewPortWidth = window.innerWidth;

    $tiles.css('height', (viewPortHeight - 60 - 68) / ((viewPortWidth > 699) ? 2 : 4));

    $(window).on('resize', function() {
        if (viewPortHeight !== window.innerHeight || viewPortWidth !== window.innerWidth) {
            viewPortHeight = window.innerHeight;
            viewPortWidth = window.innerWidth;
            $tiles.css('height', (viewPortHeight - 60 - 68) / ((viewPortWidth > 699) ? 2 : 4));
        }
    });

};

module.exports = new App();
