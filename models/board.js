const mongoose = require('mongoose');
const Joi = require('@hapi/joi');

const Board = mongoose.model(
  'Board',
  mongoose.Schema({
    name: { type: String, required: true }
  })
);

function validate(board) {
  const schema = Joi.object({ name: Joi.string().required() });
  return schema.validate(board, { abortEarly: false, allowUnknown: true });
}

module.exports = { Board, validate };
