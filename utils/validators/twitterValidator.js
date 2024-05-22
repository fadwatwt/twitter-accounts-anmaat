const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.analyticValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  validatorMiddleware,
];

exports.updateValidator = [
  check('account').notEmpty().withMessage('اسم الحساب مطلوب'),
  validatorMiddleware,
];

exports.tweetValidator = [
  check('account').notEmpty().withMessage('اسم الحساب مطلوب'),
  check('tweet').notEmpty().withMessage('نص التغريدة مطلوب'),
  validatorMiddleware,
];

exports.updateAccountsValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  validatorMiddleware,
];
exports.deleteTweetValidator = [
  check('account').notEmpty().withMessage('اسم الحساب مطلوب'),
  validatorMiddleware,
];
exports.deleteTweetAccountsValidator = [
  check('count')
    .optional()
    //.isNumeric()
    .custom((c, { req }) => {
      const acc = req.body.accounts;
      if (!acc) {
        return Promise.reject(new Error(' مطلوب مجموعة من الحسابات'));
      }
      return true;
    }),
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  validatorMiddleware,
];

exports.reTweetValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  check('url').notEmpty().withMessage('مطلوب الروابط'),
  validatorMiddleware,
];
exports.followValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  check('follow')
    .notEmpty()
    .withMessage('مطلوب الحسابات التي سوف تتابعها')
    .isArray({ min: 1 })
    .withMessage('مطلوب مجموعةمن الحسابات التي سوف تتابعها'),
  validatorMiddleware,
];
exports.replyValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  check('url').notEmpty().withMessage('مطلوب الرابط'),

  validatorMiddleware,
];
exports.resolveValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  check('type').notEmpty().withMessage('مطلوب تحديد نوع كود التحقق'),
  validatorMiddleware,
];
