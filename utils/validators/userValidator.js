const slugify = require('slugify');
const bcrypt = require('bcryptjs');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const User = require('../../model/userModel');
const Category = require('../../model/categoryModel');
const Department = require('../../model/departmentModel');
const { roles } = require('../../model/roleModel');

exports.createUserValidator = [
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
    .withMessage('لا تقل كلمة المرور عن 6 رموز')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('تأكيد كلمةالمرور غير صحيح');
      }
      return true;
    }),

  check('passwordConfirm').notEmpty().withMessage('تأكيد كلمة المرور مطلوب'),

  check('phone').optional(),
  //.isMobilePhone(["ar-EG", "ar-SA"])
  // .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  check('profileImg').optional(),
  check('role')
    .trim()
    .notEmpty()
    .withMessage('الدور مطلوب')
    .isIn(Object.values(roles))
    .withMessage('قيمة الدور خاطئة'),
  // check("Category")
  //   .notEmpty()
  //   .withMessage("التصنيف مطلوب")
  //   .isMongoId()
  //   .withMessage("تنسيق رقم التصنيف خاطئ")
  //   .custom((catID) =>
  //     Category.findById(catID).then((categ) => {
  //       if (!categ) {
  //         return Promise.reject(new Error(` ${catID}لا يوجد تصنيف بهذاالرقم `));
  //       }
  //     })
  //   ),
  check('Department')
    .notEmpty()
    .withMessage('القسم مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم القسم خاطئ')
    .custom((deptID) =>
      Department.findById(deptID).then((dept) => {
        if (!dept) {
          return Promise.reject(new Error(`${deptID}لايوجد قسم بهذاالرقم `));
        }
      })
    ),
  validatorMiddleware,
];

exports.getUserValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الموظف خاطئ'),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الموظف خاطئ'),
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('email')
    .optional()
    .isEmail()
    .withMessage('تنسيق البريد الالكتروني خاطئ')
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error('البريد الالكتروني موجود بالفعل'));
        }
      })
    ),
  check('phone').optional(),
  // .isMobilePhone(["ar-EG", "ar-SA"])
  // .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  check('profileImg').optional(),
  check('role')
    .optional()
    .isIn(Object.values(roles))
    .withMessage('قيمة الدور خاطئة'),

  // check("Category")
  //   .optional()
  //   .isMongoId()
  //   .withMessage("تنسيق رقم التصنيف خاطئ")
  //   .custom((catID) =>
  //     Category.findById(catID).then((categ) => {
  //       if (!categ) {
  //         return Promise.reject(new Error(` ${catID}لا يوجد تصنيف بهذاالرقم `));
  //       }
  //     })
  //   ),

  check('Department')
    .optional()
    .isMongoId()
    .withMessage('تنسيق رقم القسم خاطئ')
    .custom((deptID) =>
      Department.findById(deptID).then((dept) => {
        if (!dept) {
          return Promise.reject(new Error(`${deptID}لايوجد قسم بهذاالرقم `));
        }
      })
    ),
  validatorMiddleware,
];
exports.updateUserCategoryValidator = [
  check('id')
    .notEmpty()
    .withMessage('رقم الموظف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم الموظف خاطئ'),

  check('category')
    .notEmpty()
    .withMessage('التصنيف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف خاطئ')
    .custom((val) =>
      Category.findById(val).then((cat) => {
        if (!cat) {
          return Promise.reject(new Error(' لايوجد تصنيف بالرقم المدخل'));
        }
      })
    ),

  validatorMiddleware,
];
exports.changeUserPasswordValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الموظف خاطئ'),
  body('currentPassword')
    .notEmpty()
    .withMessage('يجب عليك إدخال كلمة المرور الحالية الخاصة بك'),
  body('passwordConfirm')
    .notEmpty()
    .withMessage('يجب عليك إدخال تأكيد كلمة المرور'),
  body('password')
    .notEmpty()
    .withMessage('يجب إدخال كلمة المرور الجديدة')
    .custom(async (val, { req }) => {
      // 1) Verify current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error('لايوجد موظف بهذاالاسم ');
      }
      const isCorrectPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isCorrectPassword) {
        throw new Error('كلمة المرورالحالية غير صحيحة');
      }

      // 2) Verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error('تأكيد كلمة المرور غير صحيح');
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الموظف خاطئ'),
  validatorMiddleware,
];

exports.updateLoggedUserValidator = [
  body('name')
    .optional()
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
  check('phone').optional(),
  // .isMobilePhone(["ar-EG", "ar-SA"])
  //.withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  validatorMiddleware,
];

exports.setHashTagAllow = [
  check('id')
    .notEmpty()
    .withMessage('رقم الموظف مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم الموظف خاطئ')
    .custom((val) =>
      User.findOne({ _id: val }).then((user) => {
        if (!user) {
          return Promise.reject(new Error('لايوجد موظف بهذاالرقم'));
        }
      })
    ),
  check('allowHashTag')
    .notEmpty()
    .withMessage('السماح بالهاشتاج مطلوب')
    .isBoolean()
    .withMessage('القيمة المنطقية خاطئة'),
  validatorMiddleware,
];
exports.GroupDeleteValidator = [
  check('ids')
    .notEmpty()
    .withMessage(' مطلوب أرقام الموظفين')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من أرقام الموظفين'),
  validatorMiddleware,
];
