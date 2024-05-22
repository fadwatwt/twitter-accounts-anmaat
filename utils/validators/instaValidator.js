const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.instaPostValidator = [
  check('account').notEmpty().withMessage('اسم الحساب مطلوب'),
  check('post').notEmpty().withMessage('نص التغريدة مطلوب'),
  validatorMiddleware,
];
