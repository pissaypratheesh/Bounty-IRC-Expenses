'use strict';

var fs = require('fs');

exports.homePage = function (req, res, next) {
    res.render('form.jade', function(err, html) {
        res.send(html);
    });
};
