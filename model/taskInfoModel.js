const mongoose = require('mongoose');
const { State } = require('./stateModel');

// 1- Create Schema
const taskInfoSchema = new mongoose.Schema(
  {
    TAPTaskInfo: {
      type: mongoose.Schema.Types.Mixed,
    },
    createBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      // required: [true, "Task must be belong to user"],
    },
    state: {
      type: String,
      enum: Object.values(State),
      default: State.Add,
      message: 'قيمة الحالة خاطئة',
    },
    supervisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
    },
    TaskApprovedAt: Date,
  },
  { timestamps: true }
);
Object.assign(taskInfoSchema.statics, {
  State,
});
// 2- Create model
const TaskInfoModel = mongoose.model('TaskInfo', taskInfoSchema);

module.exports = TaskInfoModel;
