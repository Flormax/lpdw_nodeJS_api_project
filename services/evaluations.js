'use strict'
var Promise = require('bluebird');
var Evaluations = Promise.promisifyAll(require('../database/evaluations'));

exports.findOneByQuery = function(query) {
    return Evaluations.findOneAsync(query);
};

exports.create = function(evaluation) {
    return Evaluations.createAsync(evaluation);
};
