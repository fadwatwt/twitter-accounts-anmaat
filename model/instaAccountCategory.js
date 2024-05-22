const mongoose = require('mongoose');
const slugify = require('slugify');

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
    slug: { type: String, index: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'InstaAccountCategory',
    },
    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InstaAccountCategory',
          index: true,
        },
        name: String,
        slug: String,
      },
    ],
  },
  { timestamps: true }
);
categorySchema.pre('save', async function (next) {
  this.slug = slugify(this.name);
  next();
});
// 2- Create model
const InstaAccountCategoryModel = mongoose.model('InstaAccountCategory', categorySchema);

module.exports = InstaAccountCategoryModel;
