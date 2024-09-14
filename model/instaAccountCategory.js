const mongoose = require('mongoose');
const slugify = require('slugify');
const Account = require('./accountModel'); // تأكد من مسار موديل الحسابات

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
  {
    timestamps: true,
    toJSON: { virtuals: true }, // إظهار الحقول الافتراضية في JSON
    toObject: { virtuals: true } // إظهار الحقول الافتراضية عند التحويل إلى كائن
  }
);
categorySchema.pre('save', async function (next) {
  this.slug = slugify(this.name);
  next();
});

categorySchema.methods.getAccountCount = async function () {
  return Account.countDocuments({ Category: this._id });
};

// Add a virtual field for accountCount
categorySchema.virtual('accountCount', {
  ref: 'account', // The model to use
  localField: '_id', // Find accounts where `localField` matches `foreignField`
  foreignField: 'Category', // The field in the Account model
  count: true, // Only return the count, not the documents
});

categorySchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'parent',
    select: ['_id','name'],
    options: { _recursed: true },
  });
  next();
});


// 2- Create model
const InstaAccountCategoryModel = mongoose.model('InstaAccountCategory', categorySchema);

module.exports = InstaAccountCategoryModel;
