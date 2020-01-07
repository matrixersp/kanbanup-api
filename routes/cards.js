const express = require('express');
const { Card, validateCard } = require('../models/card');
const { Board } = require('../models/board');
const validateObjectId = require('../middleware/validateObjectId');
const validateBoardId = require('../middleware/validateBoardId');
const validateListId = require('../middleware/validateListId');

const router = express.Router();

router.get('/', validateBoardId, async (req, res) => {
  const cards = await Card.find({ boardId: req.body.boardId });
  return res.status(200).json(cards);
});

router.get('/:id', validateObjectId, async (req, res) => {
  const card = await Card.findById(req.params.id).select('-__v');
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });
  return res.status(200).json(card);
});

router.post('/', validateBoardId, validateListId, async (req, res) => {
  const { error } = validateCard(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const { boardId, listId, title } = req.body;
  const board = await Board.findById(boardId);

  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  const listIndex = board.lists.findIndex(l => l._id.toString() === listId);

  if (listIndex === -1)
    return res
      .status(404)
      .json({ error: 'The list with the given ID was not found.' });

  const card = new Card({ boardId, listId, title });

  await card.save();
  return res.status(201).json(card);
});

router.put('/:id', validateObjectId, async (req, res) => {
  const { error } = validateCard(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const query = req.params.id;
  const update = { $set: { title: req.body.title } };
  const options = { new: true };

  const card = await Card.findByIdAndUpdate(query, update, options);

  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  return res.status(200).json(card);
});

router.delete('/:id', validateObjectId, async (req, res) => {
  const card = await Card.findByIdAndRemove(req.params.id);
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  res.status(200).json({ message: 'The card was successfully deleted.' });
});

module.exports = router;
