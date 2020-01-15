const { ObjectId } = require('mongoose').Types;

module.exports = (req, res, next) => {
  if (!req.query.boardId)
    return res.status(404).json({ error: 'Board ID is required.' });

  if (!ObjectId.isValid(req.query.boardId))
    return res.status(404).json({ error: 'Board ID is not valid.' });

  next();
};
