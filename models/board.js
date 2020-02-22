const mongoose = require('mongoose');
const Joi = require('@hapi/joi');

const listSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }]
});

const List = mongoose.model('List', listSchema);

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  lists: [listSchema],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

boardSchema.pre('findOneAndRemove', async function(next) {
  const boardId = this.getQuery()._id;

  const Card = mongoose.model('Card');
  await Card.deleteMany({ boardId });
  next();
});

const Board = mongoose.model('Board', boardSchema);

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
