require('express-async-errors');
const express = require('express');

const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const error = require('./middleware/error');
const boards = require('./routes/boards');
const lists = require('./routes/lists');
const cards = require('./routes/cards');
const users = require('./routes/users');
const auth = require('./routes/auth');

require('dotenv').config();

const dbURI = process.env.KANBELLO_DB_URI;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log(`MongoDB connected on ${dbURI}`))
  .catch(err => console.log('Could not connect to MongoDB', err));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Expose-Headers', 'X-Auth-Token');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});

app.use(express.json());
app.use(morgan('tiny'));

app.use('/api/boards', boards);
app.use('/api/lists', lists);
app.use('/api/cards', cards);
app.use('/api/users', users);
app.use('/api/auth', auth);
app.use(error);

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = server;
