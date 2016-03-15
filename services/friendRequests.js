'use strict'
var Promise = require('bluebird');
var FriendRequests = Promise.promisifyAll(require('../database/friendRequests'));
var UserService = require('../services/users');

exports.find= function(query) {
    return FriendRequests.findAsync(query)
};

exports.findOneAndUpdate = function(friendRequest_id, state) {
    return FriendRequests.findOneAndUpdateAsync(
        {_id: friendRequest_id},
        {$set: {pending: state}}
    )
}

exports.create = function(friendRequest) {
    return FriendRequests.createAsync(friendRequest);
};
