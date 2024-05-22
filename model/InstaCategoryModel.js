//employees categorys
const mongoose = require('mongoose');
// 1- Create Schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم التصنيف مطلوب'],
      unique: [true, 'يجب أن يكون اسم التصنيف فريدًا'],
      minlength: [3, 'اسم التصنيف قصير'],
      maxlength: [32, 'اسم التصنيف طويل'],
    },
    // A and B => shopping.com/a-and-b
    slug: {
      type: String,
      lowercase: true,
    },
    supervisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'المشرف مطلوب'],
    },
  },
  { timestamps: true }
);
categorySchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'supervisor',
    select: 'name',
    options: { _recursed: true },
  });

  next();
});
// 2- Create model
const InstaCategoryModel = mongoose.model('InstaCategory', categorySchema);

module.exports = InstaCategoryModel;
