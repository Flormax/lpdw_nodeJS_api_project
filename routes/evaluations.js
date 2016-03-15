var express = require('express');
var router = express.Router();
var EvaluationService = require('../services/evaluations');

router.post('/', function(req, res) {
    EvaluationService.create(req.body)
        .then(function(evaluation) {
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + evaluation.song_id);
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

module.exports = router;
