const express = require('express');
const { Card, validateCard } = require('../models/card');
const { Board } = require('../models/board');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const validateBoardId = require('../middleware/validateBoardId');
const validateQueryBoardId = require('../middleware/validateQueryBoardId');
const validateListId = require('../middleware/validateListId');

const router = express.Router();

router.get(
  '/:id',
  [auth, validateObjectId, validateQueryBoardId],
  async (req, res) => {
    const board = await Board.findOne({
      _id: req.query.boardId,
      participants: req.user._id
    });

    if (!board)
      return res
        .status(404)
        .json({ error: 'The board with the given ID was not found.' });

    const card = await Card.findById(req.params.id).select('-__v');
    if (!card)
      return res
        .status(404)
        .json({ error: 'The card with the given ID was not found.' });
    return res.status(200).json(card);
  }
);

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

  const card = new Card({ title });
  await card.save();

  board.lists[index].cards.push(card._id);
  await board.save();

  return res.status(201).json(card);
});

async function moveCard(id, boardId, userId, source, destination, res) {
  const board = await Board.findOne({
    _id: boardId,
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

  await board.save();

  return res.status(204).send();
}

async function updateTitle(id, boardId, userId, title, res) {
  const board = await Board.findOne({
    _id: boardId,
    participants: userId
  });
  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

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

router.patch('/:id', [auth, validateObjectId], async (req, res) => {
  const { error } = validateCard(req.body);

  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const { id } = req.params;
  const { boardId, source, destination, title } = req.body;

  if (source) {
    moveCard(id, boardId, req.user._id, source, destination, res);
  } else if (title) {
    updateTitle(id, boardId, req.user._id, title, res);
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

  const card = await Card.findByIdAndRemove(req.params.id);
  if (!card)
    return res
      .status(404)
      .json({ error: 'The card with the given ID was not found.' });

  res.status(200).json({ message: 'The card was successfully deleted.' });
});

module.exports = router;
