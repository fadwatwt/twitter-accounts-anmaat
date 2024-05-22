//notifications
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    type: {
      type: String,
      lowercase: true,
      required : [true , 'نوع الاشعار مطلوب']
    },
    notification: {
      type: String,
      required: [true, 'محتوي الاشعار مطلوب'],
    },
    seen: { 
      type: String,
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model('notification', notificationSchema);

module.exports = Notification;
