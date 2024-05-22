const { check } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const User = require('../../model/clientModel');

exports.serialValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) =>
      User.findOne({ email: val }).then((client) => {
        if (client) {
          return Promise.reject(new Error('E-mail already in client'));
        }
      })
    ),
  validatorMiddleware,
];

exports.verifySerialValidator = [
  check('name')
    .notEmpty()
    .withMessage('Name required')
    .isLength({ min: 3 })
    .withMessage('Too short User name'),
  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) =>
      User.findOne({ email: val }).then((client) => {
        if (!client) {
          return Promise.reject(new Error('E-mail not found'));
        }
      })
    ),
  check('serial')
    .notEmpty()
    .withMessage('Serial required')
    .isLength({ min: 30 })
    .withMessage('Serial must be at least 30 characters')
    .custom((val) =>
      User.findOne({ Serial: val }).then((client) => {
        if (!client) {
          return Promise.reject(new Error('Serial not found'));
        }
      })
    ),

  check('macAddress')
    .notEmpty()
    .withMessage('MAC Address required')
    .isMACAddress({ no_separators: true })
    .withMessage('Invalid MAC address'),
  validatorMiddleware,
];
