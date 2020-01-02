const { Schema, model } = require('mongoose');
const Joi = require('@hapi/joi');

const ListSchema = new Schema({
  title: { type: String, required: true },
  cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }]
});

const List = model('List', ListSchema);

const Board = model(
  'Board',
  new Schema({
    title: { type: String, required: true },
    lists: [ListSchema]
  })
);

function validateBoard(board) {
  const schema = Joi.object({ title: Joi.string().required() });
  return schema.validate(board, { abortEarly: false, allowUnknown: true });
}

function validateList(list) {
  const schema = Joi.object({
    title: Joi.string().required(),
    cards: Joi.array()
  });
  return schema.validate(list, { abortEarly: false, allowUnknown: true });
}

module.exports = { Board, List, validateBoard, validateList };
