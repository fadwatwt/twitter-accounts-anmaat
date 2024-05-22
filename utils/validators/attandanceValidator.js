const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const attandance = require('../../model/attandanceModel');
const User = require('../../model/userModel');

exports.createAttandanceValidator = [
  check('date')
    .notEmpty()
    .withMessage('التاريخ مطلوب')
    .isISO8601()
    .toDate()
    .withMessage('تنسيق التاريخ خاطئ'),
  check('start')
    .notEmpty()
    .withMessage('بداية الحضور مطلوبة')
    .isISO8601()
    .toDate()
    .withMessage('تنسيق التاريخ خاطئ'),
  check('end')
    .notEmpty()
    .withMessage('موعد الانصراف مطلوب')
    .isISO8601()
    .toDate()
    .withMessage('تنسيق التاريخ خاطئ'),
  check('user')
    .notEmpty()
    .withMessage('الموظف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم الموظف خاطئ')
    .custom((Id) =>
      User.findById(Id).then((att) => {
        if (!att) {
          return Promise.reject(new Error(`لايوجد موظف بهذا الرقم ${Id}`));
        }
      })
    ),

  validatorMiddleware,
];

exports.getAttandanceValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الحضور خاطئ'),
  validatorMiddleware,
];

exports.updateAttandanceValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الحضور خاطئ'),
  validatorMiddleware,
];

// exports.deleteAttandanceValidator = [
//   check('id').isMongoId().withMessage('Invalid ID formate'),
//   validatorMiddleware,
// ];
