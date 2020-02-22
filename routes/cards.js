const express = require('express');
const { Card, validateCard } = require('../models/card');
const { Board } = require('../models/board');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const validateBoardId = require('../middleware/validateBoardId');
const validateListId = require('../middleware/validateListId');

const router = express.Router();

router.get('/:id', [auth, validateObjectId], async (req, res) => {
  const card = await Card.findById(req.params.id).select('-__v');
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  const board = await Board.findOne({
    _id: card.boardId,
    participants: req.user._id
  });
  if (!board) return res.status(403).json({ error: 'Access forbidden.' });

  return res.status(200).json(card);
});

router.post('/', [auth, validateBoardId, validateListId], async (req, res) => {
  const { error } = validateCard(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const { boardId, listId, title } = req.body;
  const board = await Board.findOne({
    _id: boardId,
    participants: req.user._id
  });

  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  const index = board.lists.findIndex(l => l._id.toString() === listId);

  if (index === -1)
    return res
      .status(404)
      .json({ error: 'The list with the given ID was not found.' });

  const card = new Card({ boardId, listId, title });
  await card.save();

  board.lists[index].cards.push(card._id);
  await board.save();

  return res.status(201).json(card);
});

async function moveCard(id, userId, source, destination, res) {
  const card = await Card.findById(id);
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  const board = await Board.findOne({
    _id: card.boardId,
    participants: userId
  });
  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  const sourceList = board.lists.find(
    list => list._id.toString() === source.listId
  );
  const destinationList = board.lists.find(
    list => list._id.toString() === destination.listId
  );

  if (!sourceList || !destinationList)
    return res
      .status(404)
      .json({ error: 'The source/destination list was not found.' });

  sourceList.cards.splice(source.index, 1);
  destinationList.cards.splice(destination.index, 0, id);

  card.listId = destination.listId;

  await card.save();
  await board.save();

  return res.status(200).json(card);
}

async function updateTitle(id, userId, title, res) {
  const card = await Card.findById(id);
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  const board = await Board.findOne({
    _id: card.boardId,
    participants: userId
  });
  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  card.title = title;
  await card.save();

  return res.status(200).json(card);
}

router.patch('/:id', [auth, validateObjectId], async (req, res) => {
  const { error } = validateCard(req.body);

  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const { id } = req.params;
  const userId = req.user._id;
  const { source, destination, title } = req.body;

  if (source) {
    moveCard(id, userId, source, destination, res);
  } else if (title) {
    updateTitle(id, userId, title, res);
  }
});

router.delete('/:id', [auth, validateObjectId], async (req, res) => {
  const board = await Board.findOneAndUpdate(
    {
      _id: req.body.boardId,
      'lists._id': req.body.listId,
      participants: req.user._id
    },
    { $pull: { 'lists.$.cards': req.params.id } }
  );

  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  const card = await Card.findByIdAndDelete(req.params.id);
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  res.status(200).json({ message: 'The card was successfully deleted.' });
});

module.exports = router;
