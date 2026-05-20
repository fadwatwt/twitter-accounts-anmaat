const slugify = require('slugify');
const { check, body } = require('express-validator');
const { query } = require('express-validator/check');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const Category = require('../../model/accountCategoryModel');
const InstaCategory = require("../../model/instaAccountCategory")

exports.getCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('رقم التصنيف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  validatorMiddleware,
];

exports.createCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('اسم التصنيف مطلوب')
    .isLength({ min: 3 })
    .withMessage('اسم التصنيف قصير')
    .isLength({ max: 32 })
    .withMessage('اسم التصنيف طويل'),
  // subscriber-scoped uniqueness and parent-ownership checks live in the service layer
  check('parent')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  validatorMiddleware,
];

exports.createInstaCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('اسم التصنيف مطلوب')
    .isLength({ min: 3 })
    .withMessage('اسم التصنيف قصير')
    .isLength({ max: 32 })
    .withMessage('اسم التصنيف طويل')
    .custom((val) =>
      Category.findOne({ name: val }).then((category) => {
        if (category) {
          return Promise.reject(new Error('اسم التصنيف موجود من قبل'));
        }
      })
    ),
  check('parent')
    .optional()
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح')
    .custom((categoryId) =>
      InstaCategory.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`لايوجد تصنيف بهذا الرقم: ${categoryId}`)
          );
        }
      })
    ),
  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('رقم التصنيف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  body('name')
    .optional()
    .isLength({ min: 3 })
    .withMessage('اسم التصنيف قصير')
    .isLength({ max: 32 })
    .withMessage('اسم التصنيف طويل'),
  body('parent')
    .optional({ nullable: true })
    .custom((val) => val === null || /^[0-9a-fA-F]{24}$/.test(val))
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  // subscriber-scoped uniqueness and parent-ownership checks live in the service layer
  validatorMiddleware,
];


exports.updateInstaCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('رقم التصنيف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  body('name')
    .notEmpty()
    .withMessage('اسم التصنيف مطلوب')
    .isLength({ min: 3 })
    .withMessage('اسم التصنيف قصير')
    .isLength({ max: 32 })
    .withMessage('اسم التصنيف طويل')
    .custom((val) =>
      InstaCategory.findOne({ name: val }).then((category) => {
        if (category) {
          return Promise.reject(new Error('اسم التصنيف موجود بالفعل'));
        }
      })
    ),
  validatorMiddleware,
];

exports.moveCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('رقم التصنيف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  body('parent')
    .notEmpty()
    .withMessage('مطلوب أصل التصنيف')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح')
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`لا يوجد تصنيف بهذا الرقم: ${categoryId}`)
          );
        }
      })
    ),
  validatorMiddleware,
];
exports.deleteCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('رقم التصنيف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  validatorMiddleware,
];

exports.descendantsCategoryValidator = [
  query('id')
    .notEmpty()
    .withMessage('رقم التصنيف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح'),
  validatorMiddleware,
];
