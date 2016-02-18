'use strict'
var mongoose = require('mongoose');

var songSchema = mongoose.Schema({
    title: {type: String, required: true},
    album: {type: String, required: true},
    artist: {type: String, required: true},
    year: Number,
    bpm: Number
});

module.exports = mongoose.model('song', songSchema);