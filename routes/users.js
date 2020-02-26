const express = require('express');

const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const { User, validateUser } = require('../models/user');
const { Board } = require('../models/board');

router.get('/current', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -__v');
  console.log(user);

  const currentBoard = await Board.findById(user.currentBoard).populate(
    'lists.cards'
  );
  console.log(currentBoard);

  return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    boards: user.boards,
    currentBoard
  });
});

router.post('/', async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }

  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ error: 'User already registered.' });

  const hash = await bcrypt.hash(password, 10);

  user = new User({ name, email, password: hash });
  await user.save();

  const token = user.genAuthToken();
  return res
    .header('x-auth-token', token)
    .status(201)
    .json({
      _id: user._id,
      name: user.name,
      email: user.email
    });
});

module.exports = router;
