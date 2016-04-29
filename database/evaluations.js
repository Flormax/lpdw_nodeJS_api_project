'use strict'
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var evaluationSchema = Schema({
    evaluation: {type: Number, required: true},
    song_id: Schema.ObjectId,
    username: {type: String, required: true},
    // attention aux , en trop dans les objets JSON
});

module.exports = mongoose.model('evaluation', evaluationSchema);
