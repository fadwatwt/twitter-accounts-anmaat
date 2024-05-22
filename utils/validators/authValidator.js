const slugify = require('slugify');
const { check } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const User = require('../../model/userModel');

exports.signupValidator = [
  check('name')
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 3 })
    .withMessage('الاسم قصير')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check('email')
    .notEmpty()
    .withMessage('البريد الالكتروني مطلوب')
    .isEmail()
    .withMessage('تنسيق البريد الالكتروني خاطئ')
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error('البريد الالكتروني موجود بالفعل'));
        }
      })
    ),

  check('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب ألا تقل عن 6 حروف')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('تأكيد كلمة المرور غير صحيح');
      }
      return true;
    }),

  check('passwordConfirm').notEmpty().withMessage('تأكيد كلمة المرور مطلوب'),

  validatorMiddleware,
];

exports.loginValidator = [
  check('email')
    .notEmpty()
    .withMessage('البريد الالكتروني مطلوب')
    .isEmail()
    .withMessage('تنسيق البريد الالكتروني خاطئ'),

  check('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب ألا تقل عن 6 حروف'),

  validatorMiddleware,
];
