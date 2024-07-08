const mongoose = require('mongoose');
const { object } = require('sharp/lib/is');

// مخطط فرعي للمحتوى
const contentSchema = new mongoose.Schema(
  {
    types: {
      type: [String],
      enum: ['text', 'image', 'video', 'audio'],
      required: true,
    },
    text: {
      type: String,
    },
    url: {
      type: String,
    },
    media:{
      type: Object,
    }
  },
  {
    _id: false
  }
);

const cookiesSchema = new mongoose.Schema(
  {
    userAgent:{
      type:String
    },
    username:{
      type:String,
    },
    Proxy:{
      type:String,
    },
    cookie:{
      type:String,
    },

  },
{
  _id: false
}
)

const tweetSchema = new mongoose.Schema(
  {
    employee:{
      type:mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'حساب الناشر مطلوب'],
    },
    type:{
      type: String,
      enum: ['insta', 'tweet'],
      required: true,
      default: 'tweet'
    },
    account: {
      type: mongoose.Schema.ObjectId,
      ref: 'account',
      required: [true, 'الحساب مطلوب'],
    },
    content: contentSchema,
    cookies: cookiesSchema, // تم تعديل هذا السطر
    schedule:{
      type:String,
      default:null,
    },
    state: {
      type: Boolean,
      required: true,
      default: false // تشير إلى "لم يتم النشر"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ميدل وير لاستعلام Mongoose
tweetSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'account',
    select: ['name', '_id','AccountBasicInfo','AccountStatus'],
  });

  this.populate({
    path: 'employee',
    select: ['name', '_id'],
  });

  next();
});

module.exports = mongoose.model('TweetNotPublish', tweetSchema);
