var express = require('express');
var router = express.Router();
var FriendRequestService = require('../services/friendRequests');
var UserService = require('../services/users');

router.post('/send/:id', function(req, res) {
    var friendReq = {};
    friendReq.pending = true;
    friendReq.toUser = req.params.id;
    friendReq.fromUser = req.user._id;
    return FriendRequestService.create(friendReq)
        .then(function(friendRequest) {
            if (req.accepts('text/html')) {
                return res.redirect('/users');
            }
            if (req.accepts('application/json')) {
                return res.status(201).send(friendRequest);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.put('/accept/:id', function(req, res) {
    return FriendRequestService.find({_id: req.params.id})
        .then(function(friendReq) {
            return UserService.addFriendToUsers(friendReq[0].fromUser, req.user._id);
        })
        .then(function() {
            return FriendRequestService.findOneAndUpdate(req.params.id, false);
        })
        .then(function(){
            if (req.accepts('text/html')) {
                return res.redirect('/');
            }
            if (req.accepts('application/json')) {
                return res.status(200);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.put('/decline/:id', function(req, res) {
    FriendRequestService.findOneAndUpdate(req.params.id, false)
        .then(function(){
            if (req.accepts('text/html')) {
                return res.redirect('/');
            }
            if (req.accepts('application/json')) {
                return res.status(200);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

module.exports = router;
