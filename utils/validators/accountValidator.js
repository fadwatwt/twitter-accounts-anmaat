const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const AccountCategory = require('../../model/accountCategoryModel');
const User = require('../../model/userModel');
const Account = require('../../model/accountModel');
const { AccountStatus } = require('../../model/AccountStatusModel');
const InstaAccount = require('../../model/instaAccountCategory');

exports.getAccountValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الحساب غير صالح'),
  validatorMiddleware,
];

exports.createAccountValidator = [
  check('name')
    .notEmpty()
    .withMessage('اسم الحساب مطلوب')
    .custom((val) =>
      Account.findOne({ name: val }).then((account) => {
        if (account) {
          return Promise.reject(new Error('اسم الحساب موجود بالفعل'));
        }
      })
    ),
  check('Category')
    .notEmpty()
    .withMessage('تصنيف الحساب مطلوب')
    .isMongoId()
    .withMessage('تنسيق رقم التصنيف غير صالح')
    .custom((catID) =>
      AccountCategory.findById(catID).then((cat) => {
        if (!cat) {
          return Promise.reject(new Error(`لا يوجد تصنيف بهذا الرقم ${catID}`));
        }
      })
    ),
  check('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
  check('email')
    .optional()
    .isEmail()
    .withMessage('تنسيق البريد الالكتروني خاطئ'),
  check('employeeUser')
    .notEmpty()
    .withMessage('الموظف المسؤول عن الحساب مطلوب')
    .custom((userID) =>
      User.findById(userID).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`لايوجد موظف بهذا الرقم ${userID}`));
        }
      })
    ),
  validatorMiddleware,
];

exports.updateAccountValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الحساب غير صالح'),
  body('Category')
    .optional()
    .custom((catID) =>
      AccountCategory.findById(catID).then((cat) => {
        if (!cat) {
          return Promise.reject(new Error(`لايوجد تصنيف بهذا الرقم ${catID}`));
        }
      })
    ),
  body('AccountStatus')
    .optional()
    .isIn(Object.values(AccountStatus))
    .withMessage('قيمة حالة الحساب خاطئة'),
  validatorMiddleware,
];

exports.deleteAccountValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم الحساب غير صالح'),
  validatorMiddleware,
];

exports.importAccountValidator = [
  check('Category')
    .notEmpty()
    .withMessage('تصنيف الحسابات مطلوب')
    .custom((catID) =>
      AccountCategory.findById(catID).then((cat) => {
        if (!cat) {
          return Promise.reject(new Error(`لايوجد تصنيف بهذا الرقم ${catID}`));
        }
      })
    ),
  check('employeeUser')
    .notEmpty()
    .withMessage('الموظف المسؤول عن الحسابات مطلوب')
    .custom((userID) =>
      User.findById(userID).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`لايوجد موظف بهذا الرقم ${userID}`));
        }
      })
    ),
  validatorMiddleware,
];

exports.importInstaAccountValidator = [
  check('Category')
    .notEmpty()
    .withMessage('تصنيف الحسابات مطلوب')
    .custom((catID) =>
      InstaAccount.findById(catID).then((cat) => {
        if (!cat) {
          return Promise.reject(new Error(`لايوجد تصنيف بهذا الرقم ${catID}`));
        }
      })
    ),
  check('employeeUser')
    .notEmpty()
    .withMessage('الموظف المسؤول عن الحسابات مطلوب')
    .custom((userID) =>
      User.findById(userID).then((user) => {
        if (!user) {
          return Promise.reject(new Error(`لايوجد موظف بهذا الرقم ${userID}`));
        }
      })
    ),
  validatorMiddleware,
];

exports.pindingValidator = [
  body('clear').notEmpty().withMessage('حدد هل تريد مسح القيم المخزنة'),
  body('loopBind').notEmpty().withMessage('حدد هل تريد ربط جميع الحسابات'),
  body('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),

  validatorMiddleware,
];
///;

exports.checkValidator = [
  check('userAgent')
    .notEmpty()
    .withMessage('حدد نوع المتصفح ويب  أو موبايل')
    .isIn(['mobile', 'web'])
    .withMessage('قيمة نوع المتصفح خاطئة'),
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  validatorMiddleware,
];
///;
exports.accountDataValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  validatorMiddleware,
];
exports.accountGroupDeleteValidator = [
  check('accounts')
    .notEmpty()
    .withMessage(' مطلوب الحسابات')
    .isArray({ min: 1 })
    .withMessage(' مطلوب مجموعة من الحسابات'),
  validatorMiddleware,
];
