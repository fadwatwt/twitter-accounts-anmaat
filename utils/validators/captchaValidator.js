const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');

exports.getCaptchaValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم التحقق خاطئ'),
  validatorMiddleware,
];

exports.createCaptchaValidator = [
  check('captchaType').notEmpty().withMessage('نوع التحقق مطلوب'),
  check('captchaKey').notEmpty().withMessage(' مطلوب مفتاح التحقق'),
  validatorMiddleware,
];

exports.updateCaptchaValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم التحقق خاطئ'),
  body('captchaKey').notEmpty().withMessage(' مطلوب مفتاح التحقق'),
  check('captchaType').notEmpty().withMessage('نوع التحقق مطلوب'),
  validatorMiddleware,
];

exports.deleteCaptchaValidator = [
  check('id').isMongoId().withMessage('تنسيق رقم التحقق خاطئ'),
  validatorMiddleware,
];

exports.updateCaptchaTypeValidator = [
  //check("captchaKey").notEmpty().withMessage(" مطلوب مفتاح التحقق"),
  check('captchaType').notEmpty().withMessage('نوع التحقق مطلوب'),
  validatorMiddleware,
];
