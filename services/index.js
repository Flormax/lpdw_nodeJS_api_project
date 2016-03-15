var Promise = require('bluebird');
var Evaluations = Promise.promisifyAll(require('../database/evaluations'));
var Songs = Promise.promisifyAll(require('../database/songs'));
var _ = require('lodash');

exports.getTop5SongsByEval = function(){
    var songsEvals = [];
    return Evaluations.aggregateAsync([
            {$group: {_id:"$song_id", avgEval: {$avg: "$evaluation"}}},
            {$sort: {avgEval: -1}},
            {$limit: 5}
        ])
        .then(function(evaluations) {
            var ids = _.map(evaluations,'_id');
            songsEvals = evaluations;
            return Songs.find({_id: {$in: ids}});
        })
        .then(function(songs) {
            return _.map(songsEvals,function(n) {
                var eval = _.clone(n);
                eval.song = _.find(songs,{_id: n._id});
                return eval;
            });
        })
    ;
};
