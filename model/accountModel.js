const mongoose = require('mongoose');
const crypto = require('crypto');
const { AccountStatus } = require('./AccountStatusModel');

const accountSchema = new mongoose.Schema(
  {
    employeeUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      index: true,
      required: [true, 'رقم الموظف مطلوب'],
    },
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
      index: { unique: true, sparse: true },
    },

    phone: {
      type: String,
      index: { unique: true, sparse: true },
    },
    password: {
      type: String,
      required: [true, 'كلمة مرور الحساب مطلوبة'],
    },

    Category: {
      type: mongoose.Schema.ObjectId,
      ref: 'AccountCategory',
      index: true,
      required: [true, 'تصنيف الحساب مطلوب'],
    },
    AccountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.Normal,
    },
    Description: String,
    ////Account Basic Information
    ///（Email,Phone,Proxy,UserAgent...）
    AccountBasicInfo: {
      VerifyEmail: String,
      Location: {
        type: String,
        default: '',
      },
      MobileUserAgent: {
        type: String,
        default:
          'Mozilla/5.0 (Linux; Android 9.0.0; SM-G9500 Build/PPR1.180610.011; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/79.0.3945.73 Mobile Safari/604.1',
      },
      WebUserAgent: {
        type: String,
        default:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
      },
      Cookie: String,
      agent: {
        type: String,
        default: 'mobile',
      },
      VerifyPhone: String,
      NotAutoVerify: Boolean,
      FaKey: String,
      LogWithEmail: Boolean,
      MailServer: String,
      MailPort: String,
      RegisterAccount: Boolean,
      MailPassword: String,
      ConsumerKey: String,
      ConsumerSecret: String,
      AccessToken: String,
      AccessTokenSecret: String,
    },
    analytics: {
      type: Boolean,
      default: false,
    },
    analyticsData: {
      type: String,
    },
    ///Account data 1 =>check Account updated data (FullName,Following,Followers,Tweets,Favorites...)
    AccountDataInfo1: {
      FullName: String,
      Following: Number,
      Followers: Number,
      Tweets: Number,
      Favorites: Number,
      AccountLocation: String,
      image: String,
    },
    //////// Account data 2 (record the total number of operations of the account in system:
    /// Follow, FollowBack, Unfollow...)
    // AccountDataInfo2:{
    //     FollowNumsTotal:Number,
    //     FollowBackNumsTotal:Number,
    //     UnfollowNumsTotal:Number,
    //     TweetNumsTotal:Number,
    //     RetweetNumsTotal:Number,
    //     ReplyNumsTotal:Number,
    //     FavoriteNumsTotal:Number,
    //     DirectMessageNumsTotal:Number,
    //     AddToListNumsTotal:Number,
    //     ReportNumsTotal:Number,
    //     VoteNumsTotal:Number,
    //     AddToBookmarkNumsTotal:Number,

    // },
  },
  { timestamps: true }
);
// accountSchema.pre("save", async function (next) {

//   if (!this.isModified("password")) return next();
//   // Hashing user password
//   const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
//   const encrypted = cipher.update(this.password);
//   this.password = Buffer.concat([encrypted, cipher.final()]);
//   next();
// });
// Object.assign(accountSchema.statics, {
//   AccountStatus,
// });
accountSchema.pre(/^find/, function (next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'Category',
    select: 'name',
    options: { retainNullValues: true, _recursed: true },
  }).populate({
    path: 'employeeUser',
    select: 'name',
    options: { retainNullValues: true, _recursed: true },
  });
  next();
});
const Account = mongoose.model('account', accountSchema);

module.exports = Account;
