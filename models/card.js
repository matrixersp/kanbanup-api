const { Schema, model } = require('mongoose');
const Joi = require('@hapi/joi');

const Card = model(
  'Card',
  Schema(
    {
      title: { type: String, required: true },
      boardId: { type: Schema.Types.ObjectId, ref: 'Board' },
      listId: { type: Schema.Types.ObjectId, ref: 'List' }
    },
    { timestamps: true }
  )
);

function validateCard(card) {
  const schema = Joi.object({ title: Joi.string().required() });
  return schema.validate(card, { abortEarly: false, allowUnknown: true });
}

module.exports = { Card, validateCard };
