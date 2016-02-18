'use strict'
var Promise = require('bluebird');
var Songs = Promise.promisifyAll(require('../database/songs'));

exports.find = function(query) {
    return Songs.findAsync(query);
};

exports.findOneByQuery = function(query) {
    return Songs.findOneAsync(query);
};

exports.create = function(song) {
    return Songs.createAsync(song);
};

exports.deleteAll = function() {
    return Songs.removeAsync();
};

exports.updateSongById = function(songId, songToUpdate) {
    // return Songs.updateAsync({_id: songId}, songToUpdate); // updates but doesn't return updated document
    return Songs.findOneAndUpdateAsync({_id: songId}, songToUpdate, {new: true}); // https://github.com/Automattic/mongoose/issues/2756
};