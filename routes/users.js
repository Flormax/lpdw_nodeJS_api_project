var express = require('express');
var router = express.Router();
var UserService = require('../services/users');
var SongService = require('../services/songs');
var FriendRequestService = require('../services/friendRequests');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

router.get('/', function(req, res, next) {
    //Variable pour stocker et retourner les résultats des requêtes
    var socialData = {};
    //Variable pour stocker tout les ids exclus de la requête qui charge les users
    var ids = [];
    //Charge l'user courant
    return UserService.findOneByQuery({_id: req.user._id})
        .then(function(user){
            socialData.user = user;
            ids.push(user._id);
            for(var i = 0; i<user.friends.length; i++) {
                ids.push(user.friends[i]);
            }
            //Charge les reqûetes d'amitié de l'user courant (les siennes et celles qui lui sont destinées)
            return FriendRequestService.find({ $or: [
                                                    {fromUser: req.user._id, pending: true},
                                                    {toUser: req.user._id, pending: true}
                                                ] })
        })
        .then(function(requests) {
            var requested_users = [];
            //Récupère les user associés aux requetes pour afficher les username
            //Exclusion de l'user courant
            for(var i = 0; i < requests.length; i++) {
                if(requests[i].toUser != req.user._id) {
                    requested_users.push(requests[i].toUser);
                }
                if(requests[i].fromUser != req.user._id) {
                    requested_users.push(requests[i].fromUser);
                }
            }
            //Charge les utilisateurs requêtés séparément des autres pour l'indiqué sur la page
            return UserService.find({_id: {$in: requested_users}})
        })
        .then(function(requestedUsers) {
            socialData.requestedUsers = requestedUsers;
            for(var i = 0; i < requestedUsers.length; i++) {
                ids.push(requestedUsers[i]._id);
            }
            //Charge la liste des users, excepté: l'user courant, ses amis, et les users requêtés
            return UserService.find({_id: {$nin: ids}})
        })
        .then(function(users) {
            socialData.users = users;
            //Charge les amis de l'user courant
            return UserService.find({_id: {$in: socialData.user.friends}})
        })
        .then(function(friends) {
            socialData.friends = friends;
            if (req.accepts('text/html')) {
                return res.render('users', {
                    user: socialData.user,
                    users: socialData.users,
                    requested_users: socialData.requestedUsers,
                    friends: socialData.friends});
            }
            if (req.accepts('application/json')) {
                res.status(200).send(socialData);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});

router.put('/delAllFavorites', function(req, res) {
    UserService.deleteFavoriteFromUsers(req.user._id, req.user.favoriteSongs)
        .then(function (user) {
            if (req.accepts('text/html')) {
                return res.redirect('/users/me');
            }
            if (req.accepts('application/json')) {
                res.status(200).send(user);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/me', function(req, res, next) {
    //Variable globale pour stocker et retourner les résultats des requêtes
    var me = {};
    //Charge l'user courant
    return UserService.findOneByQuery({_id: req.user._id})
        .then(function(user){
            me.user = user;
            return SongService.find({_id: {$in: user.favoriteSongs}})
        })
        //Charge les favoris de l'user courant
        .then(function(songs){
            me.favorites = songs;
            if (req.accepts('text/html')) {
                return res.render('userAccount', {user: me.user, favorites: me.favorites});
            }
            if (req.accepts('application/json')) {
                res.status(200).send(me);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/:id', function(req, res) {
    //Variable globale pour stocker et retourner les résultats des requêtes
    var userProfil = {};
    //Charge l'user dont on visite la page
    return UserService.findOneByQuery({_id: req.params.id})
        .then(function(user){
            userProfil.user = user;
            return SongService.find({_id: {$in: userProfil.user.favoriteSongs}})
        })
        //Charge les favoris de l'user dont on visite la page
        .then(function(songs){
            userProfil.favorites = songs;
            return FriendRequestService.find({$or: [
                                                    {fromUser: req.user._id, toUser: req.params.id},
                                                    {toUser: req.user._id, fromUser: req.params.id}
                                                ]})
        })
        .then(function(request){
            console.log(request);
            userProfil.requested = -1;
            if(request.length != 0) {
                if(request[0].pending === true){
                    userProfil.requested = 0;
                } else {
                    userProfil.requested = 1;
                }
            }
            console.log(userProfil.requested);
            if (req.accepts('text/html')) {
                return res.render('userProfil', {user: userProfil.user, favorites: userProfil.favorites, requested: userProfil.requested});
            }
            if (req.accepts('application/json')) {
                res.status(200).send(userProfil);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/search', function(req, res) {
    if (req.accepts('text/html') || req.accepts('application/json')) {
        //Formation du filtre
        var by = req.query.by.toLowerCase()
        var filter = req.query.filter.toLowerCase().trim()
        switch(by) {
            case "username":
                var filterby = {username: filter}
                break;
            case "email":
                var filterby = {email: filter}
                break;
            default:
                res.status(400).send({err: filter + " is not a valid filter"});
                return;
        }
        //Charge les users filtrés
        UserService.find(filterby)
            .then(function(users) {
                if (req.accepts('text/html')) {
                    return res.render('users', {users: users});
                }
                if (req.accepts('application/json')) {
                    res.status(200).send(users);
                }
            })
            .catch(function(err) {
                res.status(500).send(err);
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.put('/addFavorite/:id', function(req, res) {
    UserService.addFavoriteToUsers(req.user._id, req.params.id)
        .then(function (user) {
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + req.params.id);
            }
            if (req.accepts('application/json')) {
                res.status(200).send(song);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});

router.put('/delFavorite/:id', function(req, res) {
    UserService.deleteFavoriteFromUsers(req.user._id, [req.params.id])
        .then(function (user) {
            if (req.accepts('text/html')) {
                return res.redirect('/users/me');
            }
            if (req.accepts('application/json')) {
                res.status(200).send(user);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});



module.exports = router;
