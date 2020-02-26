const express = require('express');

const router = express.Router();
const Joi = require('@hapi/joi');
const bcrypt = require('bcrypt');
const { User } = require('../models/user');
const { Board } = require('../models/board');

function validate(user) {
  const schema = Joi.object({
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email(),
    password: Joi.string()
      .min(6)
      .max(255)
      .required()
  });
  return schema.validate(user, { abortEarly: false, allowUnknown: true });
}

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    const errors = [];
    error.details.forEach(d => errors.push({ error: d.message }));
    return res.status(400).json({ errors });
  }
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('-__v');
  if (!user)
    return res.status(400).json({ error: 'Invalid Email or password.' });

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword)
    return res.status(400).json({ error: 'Invalid Email or password.' });

  const currentBoard = await Board.findById(user.currentBoard).populate(
    'lists.cards'
  );

  const token = user.genAuthToken();
  return res.header('x-auth-token', token).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    boards: user.boards,
    currentBoard
  });
});

module.exports = router;
