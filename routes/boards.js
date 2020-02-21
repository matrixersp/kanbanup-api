const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { Board, validateBoard } = require('../models/board');
const { User } = require('../models/user');

router.get('/', auth, async (req, res) => {
  const boards = await Board.find({ participants: req.user._id }).select(
    '-__v'
  );
  res.status(200).json(boards);
});

router.get('/:id', auth, validateObjectId, async (req, res) => {
  const board = await Board.findOne({
    _id: req.params.id,
    participants: req.user._id
  })
    .populate('lists.cards')
    .select('-__v');

  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  res.status(200).json(board);
});

router.post('/', auth, async (req, res) => {
  const { error } = validateBoard(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const user = await User.findById(req.user._id);
  if (!user)
    return res
      .status(404)
      .json({ message: 'The user with the given ID was not found.' });

  const board = new Board({
    title: req.body.title,
    creator: req.user._id,
    participants: req.user._id
  });

  await board.save();

  res.status(201).json(board);
});

router.patch('/:id', auth, validateObjectId, async (req, res) => {
  const { error } = validateBoard(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const board = await Board.findOneAndUpdate(
    {
      _id: req.params.id,
      participants: req.user._id
    },
    { title: req.body.title },
    { new: true }
  );
  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  res.status(200).json(board);
});

router.delete('/:id', auth, validateObjectId, async (req, res) => {
  const board = await Board.findOneAndRemove({
    _id: req.params.id,
    creator: req.user._id
  });
  if (!board)
    return res
      .status(404)
      .json({ error: 'The board with the given ID was not found.' });

  // TODO: Delete cards after deleting board
  res.status(200).json({ message: 'The board was successfully deleted.' });
});

module.exports = router;
