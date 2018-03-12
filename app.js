const dotenv = require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
//const favicon = require('serve-favicon');
const index = require('./routes/index');
const users = require('./routes/users');

const app = express();

// find ENV and if not found then throw error!
if (dotenv.error) {
  throw dotenv.error;
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.sessionSecert,
  resave: true,
  saveUninitialized: true,
  cookie:
  { maxAge: 60000000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((err, req, res, next) => {
  //some security mechanism headers to avoid errors in browser
  res.header("Access-Control-Allow-Origin", process.env.BASE_URL);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, DELETE, POST, GET, PATCH')
    return res.status(200).json({});
  }
  next();
});

app.use('/api', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
