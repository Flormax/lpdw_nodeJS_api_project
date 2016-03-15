var express = require('express');
var router = express.Router();
var IndexService = require('../services/index');
var UserService = require('../services/users');
var FriendRequestService = require('../services/friendRequests');
var Promise = require('bluebird');
var Users = Promise.promisifyAll(require('../database/users'));

router.get('/', function(req, res, next) {
    var homeDatas = {};
    //Charge d'éventuelles requêtes d'amitié
    return FriendRequestService.find({toUser: req.user._id, pending: true})
        .then(function(friendRequests) {
            //Charge le nom des user ayant envoyé les requêtes
            var requester = [];
            for(var i = 0; i<friendRequests.length; i++) {
                requester[i] = friendRequests[i].fromUser;
            }
            homeDatas.friendReqs = friendRequests;
            return UserService.find({_id: {$in: requester}})
        })
        .then(function(requesters) {
            homeDatas.requesters = requesters;
            //Charge le top 5 chanson
            return IndexService.getTop5SongsByEval()
        })

        .then(function(songs) {
            homeDatas.top5 = songs;
            //Charge les 3 derniers user enregistrés
            return Users.find()
                        .sort({createdAt: -1})
                        .limit(3);
        })
        .then(function(users) {
            if (req.accepts('text/html')) {
                homeDatas.newestUsers = users
                return res.render('home', {
                    songs: homeDatas.top5,
                    users: homeDatas.newestUsers,
                    friendReqs : homeDatas.friendReqs,
                    requesters: homeDatas.requesters});
            }
            if (req.accepts('application/json')) {
                res.status(200).send(homeDatas);
            }
        })
});

module.exports = router;
