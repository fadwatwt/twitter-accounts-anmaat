const mongoose = require('mongoose');

const userCvSchema = new mongoose.Schema(
  {
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
    },
    name: {
        type: String,
        trim: true,
        required: [true, 'الاسم مطلوب'],
      },
    email: {
        type: String,
        required: [true, 'البريد الالكتروني'],
        unique: true,
        lowercase: true,
    },
    phone: { 
        type: String,
        required: [true, 'رقم الهاتف مطلوب']
    },
    address : {
        type: String,
        required: [true, 'العنوان مطلوب']
    },
    about: String,
    job_name: String,
    lang: { 
        type: Array(),
    },
    expertise: {
        type: Array(),
    },
    education: {
        type: Array(),
    },
    work_experience: {
        type: Array(),
    }
  },
  { timestamps: true }
);

const UserCv = mongoose.model('userCv', userCvSchema);

module.exports = UserCv;
