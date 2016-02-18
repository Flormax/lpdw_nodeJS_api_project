'use strict'
var Promise = require('bluebird');
var Users = Promise.promisifyAll(require('../database/users'));

exports.findOneByQuery = function(query) {
    return Users.findOneAsync(query);
};

exports.createUser = function(user) {
    return Users.createAsync(user);
};