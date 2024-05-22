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
    slug: {
      type: String,
      index: true
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'AccountCategory',
    },
    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AccountCategory',
          index: true,
        },
        name: String,
        slug: String,
      },
    ],
  },
  { timestamps: true }
);

// Pre-save middleware to create slug from name
categorySchema.pre('save', async function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// 2- Create model
const AccountCategoryModel = mongoose.model('AccountCategory', categorySchema);

module.exports = AccountCategoryModel;
