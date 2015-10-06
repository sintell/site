/* jshint browser:true */
/* jshint node:true */
/* jshint esnext:true */

var Notes = function() {
    'use strict';

    var SLIDE_TIMEOUT = 500;

    var $ = require('jquery');
    var $notesForm = $('.App-Notes-Form');
    var $notesList = $('.App-Notes-List');
    var slideTimeout;

    $notesForm.on('focus', 'input, textarea', function() {
        if (slideTimeout !== null) {
            clearTimeout(slideTimeout);
            slideTimeout = null;
        }

        $notesForm.css({'width': '70%'});
        $notesList.css({'width': '30%'});
    });

    $notesForm.on('blur', 'input, textarea', function() {
        slideTimeout = setTimeout(function() {
            $notesForm.css({'width': '30%'});
            $notesList.css({'width': '70%'});
        }, SLIDE_TIMEOUT);
    });
};

module.exports = new Notes();
