'use strict'
var Promise = require('bluebird');
var Users = Promise.promisifyAll(require('../database/users'));

exports.find = function(query) {
    return Users.findAsync(query);
};

exports.findOneByQuery = function(query) {
    return Users.findOneAsync(query);
};

exports.createUser = function(user) {
    return Users.createAsync(user);
};

exports.deleteFavoriteFromUsers = function(user_id, song_id) {
    return Users.findOneAndUpdateAsync(
        {_id: user_id},
        {$pull: {favoriteSongs: {$in: song_id}}}
    )
}

exports.addFavoriteToUsers = function(user_id, song_id) {
    return Users.findOneAndUpdateAsync(
        {_id: user_id},
        {$push: {favoriteSongs: song_id}},
        {new: true}
    )
}

exports.addFriendToUsers = function(user_id, friend_id) {
    return Users.findOneAndUpdateAsync(
        {_id: user_id},
        {$push: {friends: friend_id}},
        {new: true}
    )
    .then(function() {
        return Users.findOneAndUpdateAsync(
            {_id: friend_id},
            {$push: {friends: user_id}},
            {new: true}
        )
    })
}
