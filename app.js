const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const createResponse = require('./Utils/resMessage');
const app = express();
require('dotenv').config();

// Getting data in json format

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'https: data:', 'unsafe-inline'],
      'script-src': ["'self'", "'unsafe-inline'", 'example.com']
    }
  })
);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static('static'));

app.use(function (req, res, next) {
  // res.header('Access-Control-Allow-Origin', 'https://protected-woodland-32658.herokuapp.com');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Expose-Headers', 'x-auth-token');
  res.header('Access-Control-Allow-Headers', 'Origin, x-auth-token, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  next();
});

//connect MongoDB

const dbUrl = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.fkmrvqt.mongodb.net/${process.env.MONGODB_DBNAME}?retryWrites=true&w=majority`;

mongoose
  .connect(dbUrl) //{ useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true,} are deprecated for mangoose 6 version
  .then(() => console.log('Database successfully connected'))
  .catch(err => console.log('Database not connected', err));

//add Routes
const user = require('./Routes/user');
app.use('/api/user', user);

app.get('/', (req, res) => {
  res.render('home.pug', { name: 'Hi venkatesh' });
});

app.get('*', (req, res) => {
  createResponse(res, 500, undefined, 'page not found');
});

app.use((err, req, res, next) => {
  res.status(500).json(err);
});

module.exports = app;
