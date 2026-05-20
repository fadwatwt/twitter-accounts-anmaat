const mongoose = require('mongoose');
const slugify = require('slugify');

const Account = require('./accountModel');

const categorySchema = new mongoose.Schema(
  {
    // anmat subscriber that owns this category (tenant isolation)
    subscriber_id: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      required: [true, 'Subscriber ID is required'],
    },
    // anmat user that created the category (Subscriber or Employee)
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'اسم التصنيف مطلوب'],
      minlength: [3, 'اسم التصنيف قصير'],
      maxlength: [32, 'اسم التصنيف طويل'],
    },
    slug: {
      type: String,
      index: true,
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Category names must be unique *within* a subscriber, not globally.
categorySchema.index({ subscriber_id: 1, name: 1 }, { unique: true });

categorySchema.pre('save', async function (next) {
  this.slug = slugify(this.name, { lower: true });

  if (this.parent) {
    const parentCategory = await mongoose
      .model('AccountCategory')
      .findOne({ _id: this.parent, subscriber_id: this.subscriber_id });
    if (!parentCategory) {
      return next(new Error('الفئة الأب غير موجودة أو لا تخص نفس المشترك'));
    }

    this.ancestors = [...parentCategory.ancestors];
    this.ancestors.push({
      _id: parentCategory._id,
      name: parentCategory.name,
      slug: parentCategory.slug,
    });
  }

  next();
});

categorySchema.methods.getAccountCount = async function () {
  return Account.countDocuments({
    Category: this._id,
    subscriber_id: this.subscriber_id,
  });
};

categorySchema.virtual('accountCount', {
  ref: 'account',
  localField: '_id',
  foreignField: 'Category',
  count: true,
});

categorySchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'parent',
    select: ['_id', 'name'],
    options: { _recursed: true },
  });
  next();
});

const AccountCategoryModel = mongoose.model('AccountCategory', categorySchema);

module.exports = AccountCategoryModel;
