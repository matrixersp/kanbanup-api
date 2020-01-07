const { ObjectId } = require('mongoose').Types;

module.exports = (req, res, next) => {
  if (!req.body.listId)
    return res.status(404).json({ error: 'List ID is required.' });

  if (!ObjectId.isValid(req.body.listId))
    return res.status(404).json({ error: 'List ID is not valid.' });

  next();
};
