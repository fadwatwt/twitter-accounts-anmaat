const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const Category = require('../../model/categoryModel');
const User = require('../../model/userModel');
const { State } = require('../../model/stateModel');

exports.createTaskValidator = [
  check('tweetFile').notEmpty().withMessage('ملف المحتوى مطلوب'),

  check('category')
    .notEmpty()
    .withMessage('تصنيف المحتوى')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف خاطئ')
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`لايوجد تصنيف بهذا الرقم ${categoryId}`)
          );
        }
      })
    ),
  check('images').optional().isArray().withMessage('يجب أن تكون الصور مصفوفة '),
  // check("contentWriting")
  //   .notEmpty()
  //   .withMessage("Tweet must be belong to a content writing")
  //   .isMongoId()
  //   .withMessage("Invalid ID formate")
  //   .custom((userId) =>
  //     User.findById(userId).then((user) => {
  //       if (!user) {
  //         return Promise.reject(new Error(`No User for this id: ${userId}`));
  //       }
  //     })
  //   ),
  validatorMiddleware,
];

exports.getTaskValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المحتوى خاطئ'),
  validatorMiddleware,
];

exports.updateTaskValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المحتوى خاطئ'),
  check('state')
    .optional()

    .isIn(Object.values(State))
    .withMessage('قيمة الحالة خاطئة')
    .custom((stat, { req }) => {
      const manager = req.body.supervisor;
      if (!manager) {
        return Promise.reject(new Error(`لايوجد مدير للمهمة`));
      }
      return true;
    }),
  check('supervisor')
    .optional()
    .notEmpty()
    .withMessage('المدير مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم المدير خاطئ')
    .custom((userId) =>
      User.findById(userId).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`لايوجد موظف بهذا الرقم ${userId}`));
        }
      })
    ),
  validatorMiddleware,
];

// exports.deleteProductValidator = [
//   check('id').isMongoId().withMessage('Invalid ID formate'),
//   validatorMiddleware,
// ];
