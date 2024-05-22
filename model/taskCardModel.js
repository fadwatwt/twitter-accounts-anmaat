const mongoose = require('mongoose');
const taskCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
  { timestamps: true }
);
// 2- Create model
const taskCardModel = mongoose.model('taskCard', taskCardSchema);

module.exports = taskCardModel;
