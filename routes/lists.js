const express = require('express');

const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');

const { Board, List, validateList } = require('../models/board');

router.post('/', validateObjectId, async (req, res) => {
  const { error } = validateList(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const list = new List({ title: req.body.title });
  const update = { $push: { lists: list } };
  const options = { new: true };

  const board = await Board.findByIdAndUpdate(
    req.body.boardId,
    update,
    options
  );

  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  return res.status(201).json(board.lists[board.lists.length - 1]);
});

router.put('/:id', validateObjectId, async (req, res) => {
  const { error } = validateList(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const query = { _id: req.body.boardId, 'lists._id': req.params.id };
  const update = { $set: { 'lists.$.title': req.body.title } };
  const options = { new: true };

  const board = await Board.findOneAndUpdate(query, update, options);

  if (!board)
    return res
      .status(404)
      .json({ error: 'The list with the given ID was not found.' });

  const list = board.lists.find(l => req.params.id === l._id.toString());

  res.status(200).json(list);
});

router.delete('/:id', validateObjectId, async (req, res) => {
  const board = await Board.findById(req.body.boardId);

  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  const index = board.lists.findIndex(l => req.params.id === l._id.toString());

  if (index === -1)
    return res
      .status(404)
      .json({ error: 'The list with the given ID was not found.' });

  board.lists.splice(index, 1);

  await board.save();

  res.status(200).json({ message: 'The list was successfully deleted.' });
});

module.exports = router;
