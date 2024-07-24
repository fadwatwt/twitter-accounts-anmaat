const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { roles } = require('./roleModel');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'الاسم مطلوب'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'البريد الالكتروني مطلوب'],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: String,
    password: {
      type: String,
      required: [true, 'كلمة السر مطلوبة'],
      minlength: [6, 'كلمة السر قصيرة'],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: Object.values(roles),
      default: roles.user,
    },
    type: {
      type: String,
      enum: ['بالمهام', 'فريلانسر', 'دوام بالساعة'],
      default: 'بالمهام',
    },
    holidays: {
      type: Number,
      default: 0,
    },
    isHashTagAllow: {
      type: Boolean,
      default: false,
    },
    Category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    Department: {
      type: mongoose.Schema.ObjectId,
      ref: 'Department',
    },
    tasks: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Task',
      }
    ],
    socialType: [String],  // تحديد نوع العناصر في المصفوفة
    rating: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    totalTasksRated: {
      type: Number,
      required: true,
      default: 0,
    },
    weekEnd: {
      type: Number,
      default: 5,
      min: 0,
      max: 6,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'Category',
    select: ['name', '_id'],
    options: { _recursed: true },
  });
  this.populate({
    path: 'Department',
    select: 'name',
    options: { _recursed: true },
  });
  next();
});

const User = mongoose.model('user', userSchema);

module.exports = User;
