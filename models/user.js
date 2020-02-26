const { Schema, model } = require('mongoose');
const Joi = require('@hapi/joi');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const userSchema = Schema(
  {
    name: {
      type: String,
      minLength: 3,
      maxLength: 50,
      required: true,
      trim: true
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: '{VALUE} is not a valid email.'
      }
    },
    password: { type: String, minLength: 6, maxLength: 255, required: true },
    boards: [
      {
        _id: { type: Schema.Types.ObjectId, ref: 'Board' },
        title: { type: String, required: true, trim: true }
      }
    ],
    currentBoard: { type: Schema.Types.ObjectId, ref: 'Board' }
  },
  { timestamps: true }
);

userSchema.methods.genAuthToken = function() {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
};

const User = model('User', userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string()
      .min(3)
      .max(50)
      .required(),
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email(),
    password: Joi.string()
      .min(6)
      .max(255)
      .required(),
    repeatPassword: Joi.ref('password')
  }).with('password', 'repeatPassword');

  return schema.validate(user, { abortEarly: false, allowUnknown: true });
}

module.exports = { User, validateUser };
