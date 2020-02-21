const { Schema, model } = require('mongoose');
const Joi = require('@hapi/joi');

const Card = model(
  'Card',
  Schema(
    {
      title: { type: String, required: true, trim: true }
    },
    { timestamps: true }
  )
);

function validateCard(card) {
  const source = Joi.object().keys({
    listId: Joi.string()
      .length(24)
      .required()
      .when('...destination.index', {
        is: Joi.equal(Joi.ref('index')),
        then: Joi.disallow(Joi.ref('...destination.listId'))
      }),
    index: Joi.number()
      .integer()
      .min(0)
      .required()
      .when('...destination.listId', {
        is: Joi.equal(Joi.ref('listId')),
        then: Joi.disallow(Joi.ref('...destination.index'))
      })
  });

  const destination = Joi.object().keys({
    listId: Joi.string()
      .length(24)
      .required(),
    index: Joi.number()
      .integer()
      .min(0)
      .required()
  });

  const schema = Joi.object({
    title: Joi.string().when('source', {
      not: Joi.exist(),
      then: Joi.required()
    }),
    source,
    destination
  }).and('source', 'destination');

  return schema.validate(card, { abortEarly: false, allowUnknown: true });
}

module.exports = { Card, validateCard };
