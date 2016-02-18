var _ = require('lodash');
var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();
var UserService = require('../services/users');

router.get('/', function(req, res) {
    var err = (req.session.err) ? req.session.err : null;
    if (req.accepts('text/html')) {
        res.render('signup', {err: err});
    }
    else {
        res.send(406, {err: 'Not valid type for asked ressource'});
    }
});

var bodyVerificator = function(req, res, next) {
    var attributes = _.keys(req.body);
    var mandatoryAttributes = ['username', 'password', 'displayName'];
    var missingAttributes = _.difference(mandatoryAttributes, attributes);
    if (missingAttributes.length) {
        res.status(400).send({err: missingAttributes.toString()});
    }
    else {
        if (req.body.username && req.body.password && req.body.displayName) {
            next();
        }
        else {
            var error = mandatoryAttributes.toString() + ' are mandatory';
            if (req.accepts('text/html')) {
                req.session.err = error;
                res.redirect('/signup');
            }
            else {
                res.status(400).send({err: error});
            }
        }
    }
};

router.post('/', bodyVerificator, function(req, res) {
    if (req.accepts('application/json') || req.accepts('text/html')) {
        UserService.findOneByQuery({username: req.username})
            .then(function(user) {
                if (user) {
                    res.send(409, {err: 'Existing user'});
                    return;
                } else {
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(req.body.password, salt);
                    req.body.password = hash;
                    UserService.createUser(req.body)
                        .then(function(user) {
                            if (req.accepts('text/html')) {
                                return res.render('registered', {user: user});
                            }
                            if (req.accepts('application/json')) {
                                return res.status(200).send(user);
                            }
                        });
                }
            });
    } else {
        res.send(406, {err: 'Not valid type for asked ressource'});
        return;
    }
});

module.exports = router;