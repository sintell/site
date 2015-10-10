/* jshint browser:true */
/* jshint node:true */
/* jshint esnext:true */

var Menu = function() {
    'use strict';

    var $ = require('jquery');

    var $menu = $('.App-Menu');
    var $header = $('.App-Header');
    var $triggerLinks = $('.App-Menu-Trigger', $menu);
    var $loginForm = $('.App-LoginForm', $header);
    var $logoutForm = $('.App-LogoutForm', $header);

    $triggerLinks.on('click', function(event) {
        event.preventDefault();

        $(event.target).toggleClass('icon_pressed');
        $header.toggleClass('header_expanded');
        $('.App-UserInfo').toggleClass('user-info_expanded');
    });

    $loginForm.on('submit', function(event) {
        event.preventDefault();

        $.post('/login', $loginForm.serialize())
            .success(function() {
                $('body').trigger('app.login-success');
            })
            .fail(function() {
                $('body').trigger('app.login-fail');
            });
    });

    $logoutForm.on('submit', function(event) {
        event.preventDefault();

        $.post('/logout', $logoutForm.serialize())
            .success(function() {
                $('body').trigger('app.logout-success');
            })
            .fail(function() {
                $('body').trigger('app.logout-fail');
            });
    });

};

module.exports = new Menu();
