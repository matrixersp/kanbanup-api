const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

const dbURI = process.env.KANBANUP_DB_URI;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log(`MongoDB connected on ${dbURI}`))
  .catch(err => console.log('Could not connect to MongoDB', err));

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = server;
