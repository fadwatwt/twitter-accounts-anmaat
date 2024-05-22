const express = require('express');
const { roles } = require('../model/roleModel');

const {
  updateCaptchaTypeValidator,
  deleteCaptchaValidator,
  updateCaptchaValidator,
  createCaptchaValidator,
  getCaptchaValidator,
} = require('../utils/validators/captchaValidator');

const {
  getCaptchas,
  getCaptcha,
  createCaptcha,
  updateCaptcha,
  deleteCaptcha,
  updateCaptchaByType,
} = require('../services/captchaService');

const authService = require('../services/authService');

const router = express.Router();

router.route('/').get(authService.protect, getCaptchas).post(
  authService.protect,
  // authService.allowedTo(roles.admin),
  createCaptchaValidator,
  createCaptcha
);
router.route('/:id').get(authService.protect, getCaptchaValidator, getCaptcha);
// .put(
//   authService.protect,
//   authService.allowedTo(roles.admin),
//   updateCaptchaValidator,
//   updateCaptcha
// )
// .delete(
//   authService.protect,
//   authService.allowedTo(roles.admin),
//   deleteCaptchaValidator,
//   deleteCaptcha
// );
router.route('/update').post(
  authService.protect,
  // authService.allowedTo(roles.admin),
  updateCaptchaTypeValidator,
  updateCaptchaByType
);
module.exports = router;
