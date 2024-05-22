const mongoose = require('mongoose');

// 1- Create Schema
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم القسم مطلوب'],
      unique: [true, 'يجب أن يكون اسم القسم فريدًا'],
      minlength: [3, 'اسم القسم قصير'],
      maxlength: [32, 'اسم القسم طويل'],
    },
    // A and B => shopping.com/a-and-b
    slug: {
      type: String,
      lowercase: true,
    },
    supervisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      // required: [true, 'المشرف مطلوب'],
    },
  },
  { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

departmentSchema.pre(/^find/, function (next) {
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
const DepartmentModel = mongoose.model('Department', departmentSchema);

module.exports = DepartmentModel;
