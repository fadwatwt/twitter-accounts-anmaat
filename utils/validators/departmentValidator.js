const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const User = require('../../model/userModel');

exports.getDepartmentValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم القسم خاطئ'),
  validatorMiddleware,
];

exports.createDepartmentValidator = [
  check('name')
    .notEmpty()
    .withMessage('اسم القسم مطلوب')
    .isLength({ min: 3 })
    .withMessage('اسم القسم قصير')
    .isLength({ max: 32 })
    .withMessage('اسم القسم طويل')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  // check('supervisor')
  //   .notEmpty()
  //   .withMessage('مدير القسم مطلوب')
  //   .isMongoId()
  //   .withMessage('تنسيق رقم المدير خاطئ')
  //   .custom((userID) =>
  //     User.findById(userID).then((user) => {
  //       if (!user) {
  //         return Promise.reject(new Error(`${userID}لا يوجد موظف بهذا الرقم `));
  //       }
  //     })
  //   ),
  validatorMiddleware,
];

exports.updateDepartmentValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم القسم خاطئ'),
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteDepartmentValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم القسم خاطئ'),
  validatorMiddleware,
];
exports.GroupDeleteValidator = [
  check('ids')
    .notEmpty()
    .withMessage(' مطلوب أرقام الأقسام')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من أرقام الأقسام'),
  validatorMiddleware,
];
