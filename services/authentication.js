'use strict'

var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../database/users');

module.exports.songApiLocalStrategy = function() {
    return new LocalStrategy(function(username, password, done) {
        User.findOne({ username: username })
            .select('+password')
            .exec(function (err, user) {
                if (err) { return done(err); }
                if (!user) {
                    console.log('Incorrect username.');
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
    });
};