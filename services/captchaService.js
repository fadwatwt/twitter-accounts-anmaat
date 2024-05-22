const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const Captcha = require('../model/captchaModel');
const ApiError = require('../utils/apiError');

// @desc    Get list of captcha
// @route   GET /api/v1/captchas
// @access  Private
exports.getCaptchas = factory.getAll(Captcha);

// @desc    Get specific Captcha by id
// @route   GET /api/v1/captchas/:id
// @access  Private
exports.getCaptcha = factory.getOne(Captcha);

// @desc    Create Captcha
// @route   POST  /api/v1/captchas
// @access  Private
exports.createCaptcha = factory.createOne(Captcha);

// @desc    Update specific Captcha
// @route   PUT /api/v1/captchas/:id
// @access  Private/Admin
exports.updateCaptcha = factory.updateOne(Captcha);

// @desc    Delete specific Captcha
// @route   DELETE /api/v1/captchas/:id
// @access  Private/Admin
exports.deleteCaptcha = factory.deleteOne(Captcha);

exports.updateCaptchaByType = asyncHandler(async (req, res, next) => {
  const document = await Captcha.findOneAndUpdate(
    { captchaType: req.body.captchaType },
    { captchaKey: req.body.captchaKey },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`لا يوجد بيانات لهذا النوع من كود التحقق `, 404));
  }
  // Trigger "save" event when update document
  // document.save();

  res.status(200).json({ data: document });
});
