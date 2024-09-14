const mongoose = require('mongoose');
const slugify = require('slugify');

// افتراض وجود موديل للحسابات
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
    toJSON: { virtuals: true }, // إظهار الحقول الافتراضية في JSON
    toObject: { virtuals: true } // إظهار الحقول الافتراضية عند التحويل إلى كائن
  }
);

// Pre-save middleware to create slug from name
categorySchema.pre('save', async function (next) {
  // إنشاء slug من الاسم
  this.slug = slugify(this.name, { lower: true });

  // إذا تم تحديد فئة أب، تحقق من وجودها
  if (this.parent) {
    const parentCategory = await mongoose.model('AccountCategory').findById(this.parent);
    if (!parentCategory) {
      return next(new Error('الفئة الأب غير موجودة'));
    }

    // نسخ الـ ancestors من الفئة الأب
    this.ancestors = [...parentCategory.ancestors];
    this.ancestors.push({
      _id: parentCategory._id,
      name: parentCategory.name,
      slug: parentCategory.slug,
    });
  }

  next();
});

// دالة لحساب عدد الحسابات المرتبطة بهذه الفئة
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
const AccountCategoryModel = mongoose.model('AccountCategory', categorySchema);

module.exports = AccountCategoryModel;
