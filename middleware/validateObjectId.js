const { ObjectId } = require('mongoose').Types;

module.exports = (req, res, next) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(404).json({ error: 'ID is not valid.' });
  next();
};
