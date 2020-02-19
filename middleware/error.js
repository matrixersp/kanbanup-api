module.exports = (err, req, res, next) => {
  console.log(err);

  if (err.name === 'MongoError')
    return res.status(400).json({ error: err.errmsg });
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal Server Error.' });
};
