'use strict'
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true, select: false},
    displayName: {type: String, required: true},
    favoriteSongs: [String],
    createdAt: {type: Date, 'default': Date.now}
});

module.exports = mongoose.model('user', userSchema);