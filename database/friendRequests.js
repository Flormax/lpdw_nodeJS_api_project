'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var friendRequestSchema = Schema({
    fromUser: Schema.ObjectId,
    toUser: Schema.ObjectId,
    pending: Boolean,
});

module.exports = mongoose.model('friendRequest', friendRequestSchema);
