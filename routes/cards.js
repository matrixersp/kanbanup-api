const express = require('express');
const { ObjectId } = require('mongoose').Types;
const { Card, validateCard } = require('../models/card');
const { Board } = require('../models/board');
const validateObjectId = require('../middleware/validateObjectId');
const validateBoardId = require('../middleware/validateBoardId');
const validateQueryBoardId = require('../middleware/validateQueryBoardId');
const validateListId = require('../middleware/validateListId');

const router = express.Router();

router.get('/', validateQueryBoardId, async (req, res) => {
  const cards = await Card.find({ boardId: req.query.boardId });
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

async function moveCard(id, source, destination, res) {
  const card = await Card.findById(id);
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  const board = await Board.findById(card.boardId);

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
  destinationList.cards.splice(destination.index, 0, card._id);

  card.listId = destination.listId;
  await board.save();
  await card.save();

  return res.status(200).json(card);
}

async function updateTitle(id, title, res) {
  const query = id;
  const update = { $set: { title } };
  const options = { new: true };

  const card = await Card.findByIdAndUpdate(query, update, options);

  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  return res.status(200).json(card);
}

router.put('/:id', validateObjectId, async (req, res) => {
  const { error } = validateCard(req.body);

  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const { id } = req.params;
  const { source, destination, title } = req.body;

  if (source) {
    moveCard(id, source, destination, res);
  } else if (title) {
    updateTitle(id, title, res);
  }
});

router.delete('/:id', validateObjectId, async (req, res) => {
  const card = await Card.findByIdAndRemove(req.params.id);
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  await Board.findOneAndUpdate(
    {
      _id: card.boardId,
      'lists._id': card.listId
    },
    {
      $pull: { 'lists.$.cards': card._id }
    }
  );

  res.status(200).json({ message: 'The card was successfully deleted.' });
});

module.exports = router;
