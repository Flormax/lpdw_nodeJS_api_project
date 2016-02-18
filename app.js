var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var authentication = require('./services/authentication');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var routes = require('./routes/index');
var users = require('./routes/users');
var songs = require('./routes/songs');
var signup = require('./routes/signup');
var login = require('./routes/login');
var database = require('./database');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var sess = {
    secret: 'social-music-api',
    cookie: {},
    resave: false,
    saveUninitialized: true
};
app.use(session(sess));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
passport.use(authentication.songApiLocalStrategy());
app.use(passport.initialize());
app.use(passport.session());

var verifyAuth = function(req, res, next) {
    res.locals.user_session = false;
    res.locals.user_admin = false;
    if (req.originalUrl === '/signup' || req.originalUrl === '/login') {
        return next();
    }
    if (req.isAuthenticated()) {
        res.locals.user_session = true;
        res.locals.user_admin = (req.user.username === 'admin');
        return next();
    }
    if (req.accepts('text/html')) {
        return res.redirect('/login');
    }
    if (req.accepts('application/json')) {
        res.set('Location', '/login');
        return res.status(401).send({err: 'User should be logged'});
    }
};
app.use(verifyAuth);

app.use('/', routes);
app.use('/login', login);
app.use('/users', users);
app.use('/songs', songs);
app.use('/signup', signup);

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/login');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
