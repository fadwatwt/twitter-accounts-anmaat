const mongoose = require('mongoose');
// 1- Create Schema
const captchaSchema = new mongoose.Schema(
  {
    captchaType: {
      type: Number,
      required: [true, 'اسم موقع التحقق مطلوب'],
      unique: true,
    },

    captchaKey: {
      type: String,
      required: [true, 'مفتاح موقع التحقق مطلوب'],
    },
  },
  { timestamps: true }
);

// 2- Create model
const captchaModel = mongoose.model('Captcha', captchaSchema);

module.exports = captchaModel;
