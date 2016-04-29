var express = require('express');
var _ = require('lodash');
var router = express.Router();
var SongService = require('../services/songs');
var EvaluationService = require('../services/evaluations');
var UserService = require('../services/users');

var verifyIsAdmin = function(req, res, next) {
    if (req.isAuthenticated() && req.user.username === 'admin') {
        return next();
    }
    else {
        res.status(403).send({err: 'Current user can not access to this operation'});
    }
};

router.get('/', function(req, res) {
    if (req.accepts('text/html') || req.accepts('application/json')) {
        SongService.find(req.query || {})
            .then(function(songs) {
                if (req.accepts('text/html')) {
                    return res.render('songs', {songs: songs});
                }
                if (req.accepts('application/json')) {
                    res.status(200).send(songs);
                }
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.get('/search', function(req, res) {
    if (req.accepts('text/html') || req.accepts('application/json')) {
        //Formation de la requete
        var by = req.query.by.toLowerCase()
        var filter = req.query.filter.toLowerCase().trim()
        // alors, ici tu fais un lowercase du texte recherché, pour les chiffres, ça se passe bien, du coup la recherche
        // par date est OK, mais par titre, artiste, etc, étant donné que tu fais une recherche exacte, la requete renvoie rien
        // si les chansons ont des mayuscules
        switch(by) {
            case "artist":
                // pour contourner ce souci, et permettre la recherche t'aurais pu faire
                var filterby = { artist: { $regex: filter, $options: 'i' } };
                break;
            case "title":
                var filterby = {title: filter}
                break;
            case "album":
                var filterby = {album: filter}
                break;
            case "year":
                var filterby = {year: filter}
                break;
            case "bpm":
                var filterby = {bpm: filter}
                break;
            default:
                res.status(400).send({err: filter + " is not a valid filter"});
                return;
        }
        //Charge les chansons filtrées
        SongService.find(filterby)
            .then(function(songs) {
                if (req.accepts('text/html')) {
                    return res.render('songs', {songs: songs});
                }
                if (req.accepts('application/json')) {
                    res.status(200).send(songs);
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

router.get('/add', verifyIsAdmin, function(req, res) {
    var song = (req.session.song) ? req.session.song : {};
    var err = (req.session.err) ? req.session.err : null;
    if (req.accepts('text/html')) {
        req.session.song = null;
        req.session.err = null;
        return res.render('newSong', {song: song, err: err});
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.get('/:id', function(req, res) {
    var songData = {};
    if (req.accepts('text/html') || req.accepts('application/json')) {
        //Charge la chanson
        return SongService.findOneByQuery({_id: req.params.id})
            .then(function(song) {
                if (!song) {
                    res.status(404).send({err: 'No song found with id' + req.params.id});
                    return;
                }
                songData.fav = false;
                songData.song = song;
                return UserService.findOneByQuery({_id : req.user._id})
            })
            //Charge l'user courant et vérifi sa liste de favoris
            .then(function(user) {
                var i = 0;
                while(i < user.favoriteSongs.length) {
                    if (user.favoriteSongs[i] == req.params.id) {
                        songData.fav = true;
                    }
                    i++;
                }
                return EvaluationService.findOneByQuery({song_id: req.params.id, username: req.user.username})
            })
            //Check si on à évalué la chanson ou non, adapte la réponse en fonction
            .then(function(evaluation) {
                songData.eval = (evaluation ? evaluation : null);
                if (req.accepts('text/html')) {
                    return res.render('song', {
                        song: songData.song,
                        username: req.user.username,
                        fav: songData.fav,
                        eval: songData.eval});
                }
                if (req.accepts('application/json')) {
                    return res.send(200, songData);
                }
            }).catch(function(err) {
                res.status(500).send(err);
            });
    } else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.post('/favorites/:id', function(req, res) {
    // je vois pas l'intéret de cette route
    SongService.addFavoritesToUser(req.user_id, req.params.id)
        .then(function(song) {
            return res.render('song', {song: song});
        })
})

router.get('/artist/:artist', function(req, res) {
    SongService.find({artist: {$regex: req.params.artist, $options: 'i'}})
        .then(function(songs) {
            res.status(200).send(songs);
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

var songBodyVerification = function(req, res, next) {
    var attributes = _.keys(req.body);
    var mandatoryAttributes = ['title', 'album', 'artist'];
    var missingAttributes = _.difference(mandatoryAttributes, attributes);
    if (missingAttributes.length) {
        res.status(400).send({err: missingAttributes.toString()});
    }
    else {
        if (req.body.title && req.body.album && req.body.artist) {
            next();
        }
        else {
            var error = mandatoryAttributes.toString() + ' are mandatory';
            if (req.accepts('text/html')) {
                req.session.err = error;
                req.session.song = req.body;
                res.redirect('/songs/add');
            }
            else {
                res.status(400).send({err: error});
            }
        }
    }
};

router.post('/', verifyIsAdmin, songBodyVerification, function(req, res) {
    for(key in req.body){
      req.body[key] = req.body[key].toLowerCase()
    }
    SongService.create(req.body)
        .then(function(song) {
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + song._id);
            }
            if (req.accepts('application/json')) {
                return res.status(201).send(song);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.delete('/', verifyIsAdmin, function(req, res) {
    SongService.deleteAll()
        .then(function(songs) {
            res.status(200).send(songs);
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/edit/:id', verifyIsAdmin, function(req, res) {
    var song = (req.session.song) ? req.session.song : {};
    var err = (req.session.err) ? req.session.err : null;
    if (req.accepts('text/html')) {
        SongService.findOneByQuery({_id: req.params.id})
            .then(function(song) {
                if (!song) {
                    res.status(404).send({err: 'No song found with id' + req.params.id});
                    return;
                }
                return res.render('editSong', {song: song, err: err});
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.put('/:id', verifyIsAdmin, function(req, res) {
    SongService.updateSongById(req.params.id, req.body)
        .then(function (song) {
            if (!song) {
                res.status(404).send({err: 'No song found with id' + req.params.id});
                return;
            }
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + song._id);
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

router.delete('/:id', verifyIsAdmin, function(req, res) {
    SongService.removeAsync({_id: req.params.id})
        .then(function() {
            res.status(204);
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

module.exports = router;
