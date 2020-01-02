const { ObjectId } = require('mongoose').Types;

module.exports = (req, res, next) => {
  if (req.params.id && !ObjectId.isValid(req.params.id))
    return res.status(404).json({ error: 'ID is not valid.' });

  if (req.body.boardId && !ObjectId.isValid(req.body.boardId))
    return res.status(404).json({ error: 'Board ID is not valid.' });

  if (req.body.listId && !ObjectId.isValid(req.body.listId))
    return res.status(404).json({ error: 'List ID is not valid.' });

  next();
};
