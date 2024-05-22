const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const TaskInfo = require('../../model/taskInfoModel');
const User = require('../../model/userModel');
const { State } = require('../../model/stateModel');

exports.createTaskInfoValidator = [
  check('createBy')
    .notEmpty()
    .withMessage('الموظف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم الموظف خاطئ')
    .custom((userId) =>
      User.findById(userId).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`لا يوجد موظف بهذا الرقم ${userId}`));
        }
      })
    ),

  validatorMiddleware,
];

exports.getTaskInfoValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المهمة خاطئ'),
  validatorMiddleware,
];

exports.updateTaskInfoValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المهمة خاطئ'),
  check('state')
    .optional()
    .isIn(Object.values(State))
    .withMessage('قيمة الحالة خاطئة')
    .custom((state, { req }) => {
      const manager = req.body.supervisor;
      if (!manager) {
        return Promise.reject(new Error(`لايوجد مدير لهذه المهمة`));
      }

      req.TaskApprovedAt = new Date();
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
          return Promise.reject(new Error(`لايوجد مدير بهذا الرقم ${userId}`));
        }
      })
    ),
  validatorMiddleware,
];

exports.deleteTaskInfoValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم المهمة خاطئ'),
  validatorMiddleware,
];
