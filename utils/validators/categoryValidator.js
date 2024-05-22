const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const User = require('../../model/userModel');

exports.getCategoryValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم التصنيف خاطئ'),
  validatorMiddleware,
];

exports.createCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('اسم التصنيف مطلوب')
    .isLength({ min: 3 })
    .withMessage('اسم التصنيف قصير')
    .isLength({ max: 32 })
    .withMessage('اسم التصنيف طويل')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('supervisor')
    .notEmpty()
    .withMessage('مدير التصنيف مطلوب')
    .isMongoId()
    .withMessage('تسنيق رقم المدير خاطئ')
    .custom((userID) =>
      User.findById(userID).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`${userID} لايوجد موظف بهذاالرقم`));
        }
      })
    ),
  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم التصنيف خاطئ'),
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم التصنيف خاطئ'),
  validatorMiddleware,
];
exports.categoryGroupDeleteValidator = [
  check('ids')
    .notEmpty()
    .withMessage(' مطلوب أرقام التصنيف')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من أرقام التصنيف'),
  validatorMiddleware,
];
