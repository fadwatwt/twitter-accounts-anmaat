const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'اسم المهمة مطلوب'],
    },
    assignTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'الموظف مطلوب'],
    },
    description: {
      type: String,
      required: [true, 'وصف المهمة مطلوب'],
    },
    priority: {
      type: String,
      default: 'مهمة يومية',
      message: 'قيمة الأولوية خاطئة',
    },
    priorityColor: {
      type: String,
    },
    assignOn: {
      type: Date,
      required: [true, 'تاريخ بداية المهمة مطلوب'],
    },
    deadline: {
      type: Date,
      required: [true, 'تاريخ نهاية المهمة مطلوب'],
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    deliveryDescription: {
      type: String,
    },
    deliveryTime: {
      type: Date,
    },
    rating: {
      type: Number,
    },
    taskTime: {
      type: String,
      required: [true, 'وفت المهمة مطلوب'],
    },
    taskCard: {
      type: mongoose.Schema.ObjectId,
      ref: 'taskCard',
    },
    returnDescription: {
      type: String,
    },
  },

  {
    timestamps: true,
    // to enable virtual populate
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Mongoose query middleware
taskSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'assignTo',
    select: 'name',
  });

  next();
});

module.exports = mongoose.model('Task', taskSchema);
