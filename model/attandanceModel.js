//Employee attendance hours
const mongoose = require('mongoose');
// 1- Create Schema
const attandanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'الموظف مطلوب'],
    },
    end: {
      type: Date,
    },
    start: {
      type: Date,
    },
    date: {
      type: Date,
    },
    dayending: {
      type: Date,
    },
    hours: {
      type: Number,
    },
  },
  { timestamps: true }
);
attandanceSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name',
  });
  next();
});
// 2- Create model
const AttandanceModel = mongoose.model('Attandance', attandanceSchema);

module.exports = AttandanceModel;
