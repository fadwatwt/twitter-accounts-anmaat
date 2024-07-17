const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const User = require('../../model/userModel');

exports.getJobValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المهمة خاطئ'),
  validatorMiddleware,
];

exports.createJobValidator = [
  check('name')
    .notEmpty()
    .withMessage('الاسم مطلوب')
    .isLength({ min: 3 })
    .withMessage('الاسم قصير')
    .isLength({ max: 32 })
    .withMessage('الاسم طويل'),
  check('assignTo')
    .notEmpty()
    .withMessage('الموظف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم الموظف خاطئ')
    .custom((userID) =>
      User.findById(userID).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`لا يوجد موظف بهذا الرقم ${userID}`));
        }
      })
    ),
  check('description')
    .notEmpty()
    .withMessage('الوصف مطلوب')
    .isLength({ min: 3 })
    .withMessage('الوصف قصير'),
  // check('priority').notEmpty().withMessage('الأولوية مطلوبة'),
  check('deadline')
    .notEmpty()
    .withMessage('تاريخ نهاية المهمة')
    .isISO8601()
    .withMessage('تنسيق التاريخ خاطئ'),
  check('assignOn')
    .notEmpty()
    .withMessage('تاريخ بداية المهمة مطلوب')
    .isISO8601()
    .withMessage('تنسيق التاريخ خاطئ'),
  validatorMiddleware,
];

exports.updateJobValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المهمة خاطئ'),
  validatorMiddleware,
];

exports.deleteJobValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المهمة خاطئ'),
  validatorMiddleware,
];
exports.GroupDeleteValidator = [
  check('ids')
    .notEmpty()
    .withMessage(' مطلوب أرقام المهام')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من أرقام المهام'),
  validatorMiddleware,
];
