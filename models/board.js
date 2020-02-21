const { Schema, model } = require('mongoose');
const Joi = require('@hapi/joi');

const ListSchema = new Schema({
  title: { type: String, required: true, trim: true },
  cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }]
});

const List = model('List', ListSchema);

const Board = model(
  'Board',
  new Schema({
    title: { type: String, required: true, trim: true },
    lists: [ListSchema],
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    creator: { type: Schema.Types.ObjectId, ref: 'User' }
  })
);

const objectId = Joi.extend(joi => ({
  type: 'validId',
  base: joi.string(),
  messages: {
    objectId: '{{#label}} must be a valid ObjectId'
  },
  validate(value, helpers) {
    if (!/^[0-9a-fA-F]{24}$/.test(value))
      return { value, errors: helpers.error('objectId') };
  }
}));

function validateBoard(board) {
  const schema = Joi.object({
    title: Joi.string().required()
    // userId: objectId.validId().required()
  });
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
