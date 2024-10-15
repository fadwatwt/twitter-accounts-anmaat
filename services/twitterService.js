const { parse } = require('csv-parse');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const asyncHandler = require('express-async-handler');
const Account = require('../model/accountModel');
const ApiError = require('../utils/apiError');
const { login } = require('../twitterMethod/check');
const { resolveCaptcha } = require('../twitterMethod/resolveCaptcha');
const TweetNotPublish = require('../model/tweetNotPublishModel');
const {
  activateAnalytics,
  getAnalytics,
} = require('../twitterMethod/analyticsMethod');
const { AccountStatus } = require('../model/AccountStatusModel');
const {
  uploadimgFile,
  uploadMixOfFiles,
  uploadCSVFile,
  uploadMixTweet,
  uploadtxtFile,
} = require('../middleware/uploadFilesMiddleware');
const {
  updateProfileImage,
  updateProfileInfo,
  updatePassword,
  updateScreenName,
  updateProfileBanner,
} = require('../twitterMethod/updateProfile');
const {
  tweetText1,
  getLastTweets,
  deleteTweet,
  reTweet,
  unReTweet,
  unlike,
  like,
  follow,
  unfollow,
  reply,
  TweetView,
  ShowTweet,
} = require('../twitterMethod/twitterMethods');
const mongoose = require('mongoose');
const { getAll } = require('./handlersFactory');
const factory = require('./handlersFactory');
const Job = require('../model/taskModel');
const { uploadMedia } = require('../twitterMethod/uploadMedia');
const { get } = require('axios');
const { join } = require('node:path');
const { promisify } = require('node:util');

const readFile = promisify(fs.readFile);
// @desc    analytics
// @route   POST /api/v1/method/analytics
// @access  Private
exports.analytics = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  const response = [];
  for (let i = 0; i < accounts.length; i++) {
    const doc = await Account.findOne({ name: accounts[i] });
    if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
      response.push({
        status: false,
        account: accounts[i],
        message: ' العمليه غير مسموح بها',
      });
    } else if (doc && doc.AccountBasicInfo.Cookie) {
      const agent =
        doc.agent === 'mobile'
          ? doc.AccountBasicInfo?.MobileUserAgent
          : doc.AccountBasicInfo?.WebUserAgent;

      const c = {
        username: doc.name,
        Proxy: doc.AccountBasicInfo.Location,
        userAgent: agent,
        cookie: doc.AccountBasicInfo.Cookie,
      };
      if (!doc.analytics) {
        await activateAnalytics(c);
      }
      const data = await getAnalytics(c);
      if (data.error) {
        response.push({
          status: false,
          account: accounts[i],
          message: data.error,
        });
      } else {
        await Account.findOneAndUpdate(
          { name: accounts[i] },
          { analyticsData: data.html }
        );
        response.push({ status: true, account: accounts[i], data: data.html });
      }
      // console.log(t);
    } else {
      response.push({
        status: false,
        account: accounts[i],
        message: ' الرجاء تسجيل الدخول',
      });
    }
  }
  return res.status(200).json(response);
});


const fetchImageFromUrl = asyncHandler(async (url) => {
  try {
    const response = await get(url, {
      responseType: 'arraybuffer' // Important: Set the response type to arraybuffer to get binary data
    });

    return response.data; // Return the raw binary data (buffer)
  } catch (error) {
    console.error('Error fetching image from URL:', error.message);
    throw error; // Throw the error for handling in the calling function
  }
})
exports.uploadimageFile = uploadMixOfFiles([
  {
    name: 'image',
    maxCount: 1,
  },
  {
    name: 'banner',
    maxCount: 1,
  },
]);

// @desc    update
// @route   POST /api/v1/method/update
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  // console.log("update");
  let errors = [];
  const doc = await Account.findOne({ name: req.body.account });
  if (doc && req.body.description && req.body.description != '') {
    doc.Description = req.body.description;
    await doc.save();
  }

  if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
    next(new ApiError('الموقع غير متاح', '400'));
  } else if (doc && doc.AccountBasicInfo.Cookie) {
    const agent =
      doc.agent === 'mobile'
        ? doc.AccountBasicInfo?.MobileUserAgent
        : doc.AccountBasicInfo?.WebUserAgent;

    const c = {
      username: doc.name,
      Proxy: doc.AccountBasicInfo.Location,
      userAgent: agent,
      cookie: doc.AccountBasicInfo.Cookie,
    };
    //const image=null

    if (req.files.banner) {
      //console.log(req.files.banner)
      const cc = await updateProfileBanner(c, req.files.banner[0]);
      if (cc.error?.errors) {
        errors.push(cc.error.errors[0].message);
      } else if (cc.error) {
        errors.push(cc.error);
      }
    }
    if (req.files.image) {
      //console.log(req.files.image)
      const cc = await updateProfileImage(c, req.files.image[0]);
      if (cc.error?.errors) {
        errors.push(cc.error.errors[0].message);
      } else if (cc.error) {
        errors.push(cc.error);
      }
    }
    const profile = {};
    if (req.body.fullname) profile.name = req.body.fullname;
    if (req.body.url) profile.url = req.body.url;
    if (req.body.accountlocation) profile.location = req.body.accountlocation;
    if (req.body.bio) profile.description = req.body.bio;
    if (Object.keys(profile).length !== 0) {
      const update = await updateProfileInfo(c, profile);
      // console.log(update);
      if (update.error?.errors) {
        errors.push(update.error.errors[0].message);
      } else if (update.error) {
        errors.push(update.error);
      } else {
        doc.AccountDataInfo1.FullName = update.name;
        doc.AccountDataInfo1.AccountLocation = update.location;
        await doc.save();
      }
    }
    // console.log(t);
    let password = '';
    if (req.body.password) password = req.body.password;
    if (password !== '') {
      const updatePass = await updatePassword(c, password, doc.password);
      if (!updatePass.error) {
        doc.password = password;
        await doc.save();
        const relogin = await login(
          doc.name,
          password,
          c.userAgent,
          c.Proxy,
          doc.email
        );
        if (relogin.success) {
          const cookies = relogin.cookies.get('cookie');
          doc.AccountBasicInfo.Cookie = cookies;
          await doc.save();
        } else {
          errors.push('هناك مشكلة في تسجيل الدخول بعد تغيير كلمة المرور');
        }
      } else if (updatePass.error?.errors) {
        errors.push(updatePass.error.errors[0].message);
      } else if (updatePass.error) {
        errors.push(updatePass.error);
      }
    }
    let name = '';
    if (req.body.name) {
      name = req.body.name;
    }
    if (name !== '') {
      const updatePass = await updateScreenName(c, name);
      if (!updatePass.error) {
        doc.name = updatePass.screen_name;
        await doc.save();
        const relogin = await login(
          updatePass.screen_name,
          doc.password,
          c.userAgent,
          c.Proxy,
          doc.email
        );
        if (relogin.success) {
          const cookies = relogin.cookies.get('cookie');
          doc.AccountBasicInfo.Cookie = cookies;
          await doc.save();
        } else {
          errors.push('هناك مشكلة في تسجيل الدخول بعد تغيير الاسم');
        }
      } else if (updatePass.error?.errors) {
        errors.push(updatePass.error.errors[0].message);
      } else if (updatePass.error) {
        errors.push(updatePass.error);
      }
    }
  } else {
    next(new ApiError('الرجاء تسجيل الدخول', '401'));
  }
  if (errors.length > 0) {
    res.status(400).json({ errors: errors });
  } else res.status(200).json({ status: 'ok' });
});

//////////image for tweet
exports.uploadtweetImages = uploadMixOfFiles([
  {
    name: 'images',
    maxCount: 4,
  },
]);

// @desc    tweet
// @route   POST /api/v1/method/tweet
// @access  Private

exports.tweet = asyncHandler(async (req, res, next) => {
  const account = req.body.account;
  let tweet = req.body.tweet;

  const doc = await Account.findOne({ name: account });
  if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
    next(new ApiError('الموقع غير متاح', '400'));
  } else if (doc && doc.AccountBasicInfo.Cookie) {
    const agent =
      doc.agent === 'mobile'
        ? doc.AccountBasicInfo?.MobileUserAgent
        : doc.AccountBasicInfo?.WebUserAgent;

    const c = {
      username: doc.name,
      Proxy: doc.AccountBasicInfo.Location,
      userAgent: agent,
      cookie: doc.AccountBasicInfo.Cookie,
    };
    let media = null;
    if (req.files.images) {
      media = req.files.images;
    }
    let schedule = null;
    if (req.body.schedule) {
      schedule = req.body.schedule;
    }
    if (req.body.mentions) {
      let m = req.body.mentions.split(' ');
      for (let i = 0; i < m.length; i++) {
        tweet = tweet.concat(' \n', '@', m[i]);
      }
    }
    const twt = await tweetText1(c, tweet, media, schedule);
    if (twt.error?.errors) res.status(400).json({ errors: twt.error?.errors });
    else if (twt.error) res.status(400).json({ errors: twt.error });
    else if (twt.errors) res.status(400).json({ error: twt.errors[0].message });
    else res.status(200).json({ status: 'ok' });
  } else {
    next(new ApiError('الرجاء تسجيل الدخول', '401'));
  }
});
exports.uploadimportFile = uploadCSVFile('csvFile');

// @desc    update accounts
// @route   POST /api/v1/methods/updateAccounts
// @access  Private
exports.updateSetOfAccounts = asyncHandler(async (req, res, next) => {
  let allerrors = [];

  if (req.files.csvFile && req.files.csvFile[0]) {
    const accounts = req.body.accounts;
    //let path = "./uploads/csv/" + req.file.filename;
    const content = req.files.csvFile[0].buffer.toString();
    let index = 0;

    const parser = parse(content, {
      columns: true,
      delimiter: ',',
      relax_quotes: true,
      bom: true,
      to_line: accounts.length + 1,
    });
    // )
    parser.on('error', (error) => {
      next(new ApiError(`${error.message} يوجد خطأ في قراءة الملف `, 404));
    });
    let images = [];
    if (req.files.images) {
      images = req.files.images;
    }
    let banners = [];
    if (req.files.banners) {
      banners = req.files.banners;
    }
    for await (const row of parser) {
      //console.log(row)
      let errors = [];

      const profile = {};
      if (row.fullname && row.fullname !== '') profile.name = row.fullname;
      if (row.location && row.location != '') profile.location = row.location;
      if (row.url && row.url != '') profile.url = row.url;
      if (row.bio && row.bio != '') profile.description = row.bio;
      //console.log(profile)
      let password = '';

      if (row.password && row.password != '') password = row.password;
      let name = '';
      if (row.username && row.username != '') name = row.username;
      let description = '';
      if (row.description && row.description != '')
        description = row.description;
      const doc = await Account.findOne({ name: accounts[index] });
      if (doc && description != '') {
        doc.Description = description;
        await doc.save();
      }

      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        errors.push('الموقع غير متاح');
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        /////update banner image
        if (banners && index < banners.length && banners[index]) {
          //console.log(req.files.banner)
          const cc = await updateProfileBanner(c, banners[index]);
          if (cc.error?.errors) {
            errors.push(cc.error.errors[0].message);
          } else if (cc.error) {
            errors.push(cc.error);
          }
        }
        ///update profile image
        if (images && index < images.length && images[index]) {
          //console.log(req.files.image)
          const cc = await updateProfileImage(c, images[index]);
          if (cc.error?.errors) {
            errors.push(cc.error.errors[0].message);
          } else if (cc.error) {
            errors.push(cc.error);
          }
        }
        if (Object.keys(profile).length !== 0) {
          const update = await updateProfileInfo(c, profile);
          //console.log(update.error);
          if (update.error?.errors) {
            errors.push(update.error.errors[0].message);
          } else if (update.error) {
            errors.push(update.error);
          } else {
            doc.AccountDataInfo1.FullName = update.name;
            doc.AccountDataInfo1.AccountLocation = update.location;
            await doc.save();
          }
        }
        if (password !== '') {
          const updatePass = await updatePassword(c, password, doc.password);
          if (!updatePass.error) {
            doc.password = password;
            await doc.save();
            const relogin = await login(
              doc.name,
              password,
              c.userAgent,
              c.Proxy,
              doc.email
            );
            if (relogin.success) {
              const cookies = relogin.cookies.get('cookie');
              doc.AccountBasicInfo.Cookie = cookies;
              await doc.save();
            } else {
              errors.push('هناك مشكلة في تسجيل الدخول بعد تغيير كلمة المرور');
            }
          } else if (updatePass.error?.errors) {
            errors.push(updatePass.error.errors[0].message);
          } else if (updatePass.error) {
            errors.push(updatePass.error);
          }
        }

        if (name !== '') {
          const updatePass = await updateScreenName(c, name);
          if (!updatePass.error) {
            doc.name = updatePass.screen_name;
            await doc.save();
            const relogin = await login(
              updatePass.screen_name,
              doc.password,
              c.userAgent,
              c.Proxy,
              doc.email
            );
            if (relogin.success) {
              const cookies = relogin.cookies.get('cookie');
              doc.AccountBasicInfo.Cookie = cookies;
              await doc.save();
            } else {
              errors.push('هناك مشكلة في تسجيل الدخول بعد تغيير الاسم');
            }
          } else if (updatePass.error?.errors) {
            errors.push(updatePass.error.errors[0].message);
          } else if (updatePass.error) {
            errors.push(updatePass.error);
          }
        }
        if (errors.length > 0) {
          allerrors.push({ account: accounts[index], errors: errors });
        }
      } else {
        errors.push('الرجاء تسجيل الدخول');
      }
      /////
      //console.log( parser.info.records )
      index++;
      if (parser.info.records == index) {
        if (allerrors.length > 0) {
          res.status(400).json({ errors: allerrors });
        } else res.status(200).json({ status: 'ok' });
      }
    }
  } else {
    return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
  }
  //console.log(allerrors.length)
});
exports.uploadmix = uploadMixOfFiles([
  {
    name: 'images',
    // maxCount: 100,
  },
  {
    name: 'csvFile',
    maxCount: 1,
  },
  {
    name: 'banners',
    // maxCount: 100,
  },
]);
// @desc    tweet accounts
// @route   POST /api/v1/methods/tweetAccounts
// @access  Private
exports.tweetSetOfAccounts = asyncHandler(async (req, res, next) => {
  let allerrors = [];

  if (!req?.files?.csvFile || !req?.files?.csvFile[0]) {
    return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
  }
  console.log('req.body');
  console.log(req.body);
  console.log('req.body');
  const accounts = req.body.accounts;
  const content = req.files.csvFile[0].buffer.toString();

  let images = req.files.images || [];

  let tweetTxt = content.split('/');

  tweetTxt = tweetTxt.join('\n');

  for (let i = 0; i < accounts.length; i++) {
    let errors = [];
    console.log(
      '🚀 ~ file: twitterService.js:501 ~ exports.tweetSetOfAccounts=asyncHandler ~ tweet:',
      tweetTxt
    );
    const doc = await Account.findOne({ name: accounts[i] });
    console.log(
      '🚀 ~ file: twitterService.js:500 ~ exports.tweetSetOfAccounts=asyncHandler ~ doc:',
      doc
    );

    if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
      errors.push('الموقع غير متاح');
      console.error('the site is unavailable');
    } else if (doc.AccountBasicInfo?.Cookie) {
      const agent =
        doc.agent === 'mobile'
          ? doc.AccountBasicInfo?.MobileUserAgent
          : doc.AccountBasicInfo?.WebUserAgent;

      const c = {
        username: doc.name,
        Proxy: doc.AccountBasicInfo.Location,
        userAgent: agent,
        cookie: doc.AccountBasicInfo.Cookie,
      };

      console.log("before tweetTxt !== ''");
      console.log("before tweetTxt !== ''");
      console.log("before tweetTxt !== ''");

      if (tweetTxt !== '') {
        let img = [images[0]];
        let schedule = req.body.schedule || null; //null
        const twt = await tweetText1(c, tweetTxt, img, schedule);
        console.log(
          '🚀 ~ file: twitterService.js:523 ~ exports.tweetSetOfAccounts=asyncHandler ~ twt:',
          twt
        );
        if (twt.error?.errors) {
          errors.push(twt.error?.errors[0].message);
        } else if (twt.error) {
          errors.push(twt.error);
        } else if (twt.errors) {
          errors.push(twt.errors[0].message);
        }
      }
      console.log("after tweetTxt !== ''");

      if (errors.length > 0) {
        allerrors.push({ account: accounts[i], errors: errors });
      }
    } else {
      errors.push('الرجاء تسجيل الدخول');
      console.log("'الرجاء تسجيل الدخول');");
    }
  }
  // if (arr.length == index) {
  console.log(
    '🚀 ~ file: twitterService.js:535 ~ exports.tweetSetOfAccounts=asyncHandler ~ allerrors:',
    allerrors
  );
  if (allerrors.length > 0) {
    res.status(400).json({ errors: allerrors });
  } else {
    res.status(200).json({ status: 'ok' });
    console.log('GOOD RESSSS');
  }
  // }
  console.log('ALll FINE');
  console.log('ALll FINE');
  console.log('ALll FINE');
  console.log('ALll FINE');
});


exports.tweetSetOfAccountsForNotTweet = asyncHandler(async (req, res, next) => {
  let allerrors = [];
  let tweetsObject = [];

  console.log("Enter tweetSetOfAccountsForNotTweet part 1");

  if (!req?.files?.csvFile || !req?.files?.csvFile[0]) {
    return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
  }

  const accounts = req.body.accounts;
  const csvBuffer = req.files.csvFile[0].buffer;
  const tweets = [];

  let images = req.body.images || [];
  let imagesBuffer = req.files.images || [];

  const csvString = csvBuffer.toString('utf-8');
  const tweetArray = csvString.split('/').map(tweet => tweet.trim());

  tweetArray.forEach((tweet) => {
    tweets.push(tweet);
  });

  for (let i = 0; i < accounts.length; i++) {
    let errors = [];
    let imgBuffer = [imagesBuffer[0]];
    const doc =await Account.findOne({ name: accounts[i] });

      console.log("Enter tweetSetOfAccountsForNotTweet part 2",req.body.employeeId);

      let tweetObject = await TweetNotPublish.create({
        employee: req.body.employeeId,
        account: doc._id,
        schedule: req.body.schedule || null,
      });

      let content = {text:"",types:"",url:"",media:[]};

      if (images[i]) {
        content.url = images[i]; // تحديث url إلى الصورة المتوفرة
        content.types = [...content.types, 'image']; // إضافة 'image' إلى مصفوفة الأنواع
        content.media=imgBuffer
      }

      if (tweets[i]) {
        content.text = tweets[i]; // تحديث text إلى النص المتوفر
        content.types = [...content.types, 'text']; // إضافة 'text' إلى مصفوفة الأنواع
      }

      tweetObject = await TweetNotPublish.findByIdAndUpdate(tweetObject._id, { $set: { content: content } }, { new: true });

      tweetsObject.push(tweetObject);

    if (errors.length > 0) {
      allerrors.push({ account: accounts[i], errors: errors });
    }
  }

  if (allerrors.length > 0) {
    res.status(400).json({ errors: allerrors });
  } else {
    res.status(200).json({ status: 'ok', tweets: tweetsObject });
  }
});

exports.tweetsSetOfAccountsForPublisher = asyncHandler(async (req, res, next) => {
  const ids = req.body.ids;
  const errors = [];
  const allErrors = [];
  let tweets = []
  console.log(ids);
  try {
    for (let i = 0; i < ids.length; i++){
    const tweet = await TweetNotPublish.findById(ids[i]);
    const doc = await Account.findById(tweet.account._id)
      tweets.push(tweet)

    if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
      errors.push('الموقع غير متاح');
      console.error('the site is unavailable');
    } else if (doc.AccountBasicInfo.Cookie) {
      const agent =
        doc.agent === 'mobile'
          ? doc.AccountBasicInfo?.MobileUserAgent
          : doc.AccountBasicInfo?.WebUserAgent;

      if (!tweet) {
        return res.status(404).json({ message: "هذه التغريدة غير موجودة" });
      }
      console.log(tweet);

      const { schedule, content } = tweet;
      const text = content.text;
      const media = content.media

      const c = {
        username: doc.name,
        Proxy: doc.AccountBasicInfo.Location,
        userAgent: agent,
        cookie: doc.AccountBasicInfo.Cookie,
      };

      const twt = await tweetText1(c, text, media, schedule);
      console.log('🚀 ~ file: twitterService.js:523 ~ exports.tweetSetOfAccounts=asyncHandler ~ twt:', twt);

      if (twt.error?.errors) {
        errors.push(twt.error.errors[0].message);
      } else if (twt.error) {
        errors.push(twt.error);
      } else if (twt.errors) {
        errors.push(twt.errors[0].message);
      }

      if (errors.length > 0) {
        allErrors.push({ account: tweet.account, errors: errors });
      }

      const tweet2 = await TweetNotPublish.findByIdAndUpdate(
        ids[i],
        { $set: { state: true } },
        { new: true }
      );
    } else {
      errors.push('الرجاء تسجيل الدخول');
    }
    }
    if (allErrors.length > 0) {
      return res.status(400).json({ allErrors });
    } else {
      return res.status(200).json({ message: "تم نشر التغريدات بنجاح",tweets});
    }
  } catch (error) {
    console.error("Error in tweetsSetOfAccountsForPublisher:", error);
    return res.status(500).json({ message: "خطأ في الخادم الداخلي" });
  }

});

exports.getTweetsNotPublish = getAll(TweetNotPublish)

exports.getTweetsForPublisher = asyncHandler(async (req, res, next) => {
  try {
    const employeeId = req.params.id;


    if (!employeeId) {
      return res.status(400).json({ message: 'معرف الموظف مطلوب' });
    }

    const tweets = await TweetNotPublish.find({ employee: employeeId });

    if (!tweets || tweets.length === 0) {
      return res.status(404).json({ message: "لا توجد تغريدات غير منشورة لهذا الموظف" });
    }

    return res.status(200).json(tweets);
  } catch (e) {
    return res.status(500).json({ message: "خطأ في الخادم الداخلي", error: error.message });
  }
});




// exports.tweetSetOfAccountsForNotTweet = asyncHandler( async (req, res, next) => {
//   let allerrors = [];
//
//   if (!req?.files?.csvFile || !req?.files?.csvFile[0]) {
//     return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
//   }
//   console.log('req.body');
//   console.log(req.body);
//   console.log('req.body');
//   const accounts = req.body.accounts;
//   const content = req.files.csvFile[0].buffer.toString();
//
//   let images = req.files.images || [];
//
//   let tweetTxt = content.split('/');
//
//   tweetTxt = tweetTxt.join('\n');
//
//   console.log(tweetTxt);
//
//   let tweets = []
//
//   for (let i = 0; i < accounts.length; i++) {
//     let text = tweetTxt[i]
//     let image = images[i]
//     let content = {type:[],text:"",url:""}
//
//     let tweet = await  TweetNotPublish.create({
//       account: account[i],
//     });
//
//     if(image){
//       content.type.push("image")
//       content.url = image
//     }
//
//     if (text){
//       content.type.push("text")
//       content.text = text
//     }
//     tweet = await TweetNotPublish.findByIdAndUpdate(tweet._id,{ $set:{content:content }},{new:true})
//
//     tweets.push(tweet)
//   }
//
//   res.status(200).json();
// })

// Middleware لتحجيم عدة صور
exports.resizeImages = asyncHandler(async (req, res, next) => {
  // التأكد من وجود ملفات متعددة
  if (!req.files.images || req.files.images.length === 0) {
    return next(); // إذا لم يتم تحميل أي صورة، تابع إلى الوسيط التالي
  }

  // عملية تحجيم وحفظ كل صورة
  req.body.images = []; // مصفوفة لتخزين مسارات الصور المحفوظة

  await Promise.all(
    req.files.images.map(async (file) => {
      const filename = `tweet-${uuidv4()}-${Date.now()}.jpeg`;

      await sharp(file.buffer)
        .resize(600, 600)
        .toFormat('jpeg')
        .jpeg({ quality: 95 })
        .toFile(`uploads/images/${filename}`);

      // إضافة مسار الصورة المحفوظة إلى قائمة الصور
      req.body.images.push(`images/${filename}`);
    })
  );

  next(); // استدعاء الوسيط التالي بعد إكمال عمليات تحجيم وحفظ الصور
});

// @desc    deleteTweet
// @route   POST /api/v1/method/tweet/delete
// @access  Private

exports.deleteTweett = asyncHandler(async (req, res, next) => {
  const account = req.body.account;
  let count = req.body.count || null;
  let url = req.body.url || null;

  const doc = await Account.findOne({ name: account });
  if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
    next(new ApiError('الموقع غير متاح', '400'));
  } else if (doc && doc.AccountBasicInfo.Cookie) {
    const agent =
      doc.agent === 'mobile'
        ? doc.AccountBasicInfo?.MobileUserAgent
        : doc.AccountBasicInfo?.WebUserAgent;

    const c = {
      username: doc.name,
      Proxy: doc.AccountBasicInfo.Location,
      userAgent: agent,
      cookie: doc.AccountBasicInfo.Cookie,
    };
    if (url !== null) {
      url = url.split('\n');
      let noDel = 0;
      for (let i = 0; i < url.length; i++) {
        let tweet_ids = url[i]
          .substring(url[i].indexOf('/status/') + '/status/'.length)
          .replace('?p=v', '');
        const delUrl = await deleteTweet(c, tweet_ids);

        if (!delUrl.errors && !delUrl.error) {
          noDel++;
        }
      }

      res.status(200).json({ status: 'ok', noOfDeletedTweet: noDel });
    }
    if (count != null) {
      const tweetsID = await getLastTweets(c, count);
      if (tweetsID.error?.errors)
        res.status(400).json({ errors: tweetsID.error?.errors[0].message });
      else if (tweetsID.error) res.status(400).json({ errors: tweetsID.error });
      else if (tweetsID.errors)
        res.status(400).json({ errors: tweetsID.errors[0].message });
      else {
        let cc = 0;
        for await (var id of tweetsID) {
          const del = await deleteTweet(c, id);
          if (!del.errors && !del.error) {
            cc++;
          }
        }

        res.status(200).json({ status: 'ok', noOfDeletedTweet: cc });
      }
    }
  } else {
    next(new ApiError('الرجاء تسجيل الدخول', '401'));
  }
  res.status(200);
});
// @desc    deleteTweetSet
// @route   POST /api/v1/method/tweetAccountss/delete
// @access  Private

exports.deleteTweettSet = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  let count = req.body.count || null;
  let url = req.body.url || null;
  let response = [];
  if (url != null) {
    url = url.split('\n');
    let noDel = 0;
    for (let i = 0; i < url.length; i++) {
      // console.log("terererer:::", url[i]);
      // let tweet_id;
      // const tweetIdRegex = /\/status\/(\d+)/;
      // const match = tweetIdRegex.exec(url[i]);
      // if (match && match[1]) {
      //   tweet_id = match[1];
      //   console.log("Extracted Tweet ID:", tweet_id);
      // } else {
      //   console.log("No valid tweet ID found in URL:", url[i]);
      // }

      let tweet_id = url[i]
        .substring(url[i].indexOf('/status/') + '/status/'.length)
        .replace('?p=v', '');

      console.log(
        '🚀 ~ file: twitterService.js:656 ~ exports.deleteTweettSet ~ tweet_id:',
        tweet_id
      );

      let username = url[i].substring(url[i].indexOf('.com/') + 5);
      username = username.substring(0, username.indexOf('/status/'));
      username = username.toLowerCase();

      console.log(
        '🚀 ~ file: twitterService.js:665 ~ exports.deleteTweettSet ~ username:',
        username
      );

      console.log(
        '🚀 ~ file: twitterService.js:671 ~ exports.deleteTweettSet ~ accounts:',
        accounts
      );

      if (!accounts.includes(username)) {
        continue;
      }
      const doc = await Account.findOne({ name: username });
      console.log(
        '🚀 ~ file: twitterService.js:673 ~ exports.deleteTweettSet ~ doc:',
        doc
      );
      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        console.log(
          'if (doc && doc.AccountStatus == AccountStatus.NetworkError) '
        );

        let found = response.findIndex((item) => item.account === username);
        if (found === -1) {
          response.push({ account: username, errors: 'قيمة الموقع خاطئة' });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        console.log('else if (doc && doc.AccountBasicInfo.Cookie) ');
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };

        console.log('user', c);
        console.log('going to deleteTweet');
        const delUrl = await deleteTweet(c, tweet_id);
        if (!delUrl.error && !delUrl.errors) {
          let noDelete = response.findIndex(
            (item) => item.account === username
          );
          if (noDelete !== -1) {
            let counD = response[noDelete].noOfDeletedTweet;
            response[noDelete].noOfDeletedTweet = counD + 1;
          } else {
            response.push({ account: username, noOfDeletedTweet: 1 });
          }
        } else {
          let noDelete = response.findIndex(
            (item) => item.account === username
          );
          if (noDelete === -1) {
            response.push({ account: username, noOfDeletedTweet: 0 });
          }
        }
      } else {
        let found = response.findIndex((item) => item.account === username);
        if (found === -1) {
          response.push({ account: username, errors: 'يرجى تسجيل الدخول' });
        }
      }
    }
  }
  if (count != null) {
    //console.log(accounts)
    for (let i = 0; i < accounts.length; i++) {
      const doc = await Account.findOne({ name: accounts[i] });
      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'قيمة الموقع خاطئة' });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        const tweetsID = await getLastTweets(c, count);
        if (tweetsID.error?.errors)
          response.push({
            account: accounts[i],
            errors: tweetsID.error?.errors[0].message,
          });
        else if (tweetsID.error)
          response.push({ account: accounts[i], errors: tweetsID.error });
        else if (tweetsID.errors)
          response.push({
            account: accounts[i],
            errors: tweetsID.errors[0].message,
          });
        else {
          let cc = 0;
          for await (var id of tweetsID) {
            const del = await deleteTweet(c, id);
            if (!del.errors && !del.error) {
              cc++;
            }
          }

          response.push({ account: accounts[i], noOfDeletedTweet: cc });
        }
      } else {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'يرجى تسجيل الدخول' });
        }
      }
    }
  }

  res.status(200).json(response);
});

// @desc    retweet
// @route   POST /api/v1/method/retweet
// @access  Private

exports.retweetService = asyncHandler(async (req, res, next) => {
  console.log('retweetService');
  const accounts = req.body.accounts;
  console.log('accounts', accounts);
  let url = req.body.url || null;
  const response = [];
  if (url != null) {
    url = url.split('\n');
    const noreTweet = 0;
    for (let i = 0; i < accounts.length; i++) {
      console.log('before findone');
      const doc = await Account.findOne({ name: accounts[i] });
      console.log('after findone');
      console.log(doc);
      if (doc && doc.AccountStatus === AccountStatus.NetworkError) {
        const found = response.findIndex(
          (item) => item.account === accounts[i]
        );
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'قيمة الموقع خاطئة' });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        const result = await Promise.allSettled(
          url.map(async (x) => {
            let tweet_id;
            const tweetIdRegex = /(?:\/status\/|\/\d+\/status\/)(\d+)/;
            console.log('tweetIdRegex', tweetIdRegex);
            tweet_ids = tweetIdRegex.exec(x)[1];
            console.log('tweetIdRegex.exec(x)[1]');
            console.log(tweet_ids);
            tweet_ids = tweet_ids.replace('?p=v', '');
            return reTweet(c, tweet_ids);
          })
        );
        result.forEach((re) => {
          if (re.value) {
            if (!re.value.error && !re.value.errors) {
              const noDelete = response.findIndex(
                (item) => item.account === accounts[i]
              );
              if (noDelete !== -1) {
                let counD = response[noDelete].noOfReTweet;
                response[noDelete].noOfReTweet = counD + 1;
              } else {
                response.push({ account: accounts[i], noOfReTweet: 1 });
              }
            } else {
              let noDelete = response.findIndex(
                (item) => item.account === accounts[i]
              );
              if (noDelete === -1) {
                response.push({ account: accounts[i], noOfReTweet: 0 });
              }
            }
          }
        });
      } else {
        let found = response.findIndex((item) => item.account === account[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'يرجى تسجيل الدخول' });
        }
      }
    }
  }

  res.status(200).json(response);
});

// @desc    unretweet
// @route   POST /api/v1/method/retweet/delete
// @access  Private

exports.unretweetService = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  let url = req.body.url || null;
  let count = req.body.count || null;
  let response = [];
  if (url != null) {
    url = url.split('\n');
    for (let i = 0; i < accounts.length; i++) {
      const doc = await Account.findOne({ name: accounts[i] });
      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'قيمة الموقع خاطئة' });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        const result = await Promise.allSettled(
          url.map(async (x) => {
            let tweet_ids;
            const tweetIdRegex = /\/status\/(\d+)\?/;
            tweet_ids = tweetIdRegex.exec(x)[1];
            console.log(tweet_ids);
            tweet_ids = tweet_ids.replace('?p=v', '');

            return unReTweet(c, tweet_ids);
          })
        );
        result.forEach((re) => {
          if (re.value) {
            if (!re.value.error && !re.value.errors) {
              let noDelete = response.findIndex(
                (item) => item.account === accounts[i]
              );
              if (noDelete !== -1) {
                let counD = response[noDelete].noOfUnReTweet;
                response[noDelete].noOfUnReTweet = counD + 1;
              } else {
                response.push({ account: accounts[i], noOfUnReTweet: 1 });
              }
            } else {
              let noDelete = response.findIndex(
                (item) => item.account === accounts[i]
              );
              if (noDelete === -1) {
                response.push({ account: accounts[i], noOfUnReTweet: 0 });
              }
            }
          }
        });
      } else {
        let found = response.findIndex((item) => item.account === account[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'يرجى تسجيل الدخول' });
        }
      }
    }
  }
  if (count != null) {
    //console.log(accounts)
    for (let i = 0; i < accounts.length; i++) {
      const doc = await Account.findOne({ name: accounts[i] });
      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'قيمة الموقع خاطئة' });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        const tweetsID = await getLastTweets(c, count, true);
        if (tweetsID.error?.errors)
          response.push({
            account: accounts[i],
            errors: tweetsID.error?.errors[0].message,
          });
        else if (tweetsID.error)
          response.push({ account: accounts[i], errors: tweetsID.error });
        else if (tweetsID.errors)
          response.push({
            account: accounts[i],
            errors: tweetsID.errors[0].message,
          });
        else {
          let cc = 0;
          for await (var id of tweetsID) {
            const del = await unReTweet(c, id);
            if (!del.errors && !del.error) {
              cc++;
            }
          }

          response.push({ account: accounts[i], noOfDeletedTweet: cc });
        }
      } else {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'يرجى تسجيل الدخول' });
        }
      }
    }
  }
  res.status(200).json(response);
});

// @desc    like
// @route   POST /api/v1/method/like
// @access  Private

exports.likeService = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  console.log('accounts', accounts);
  let url = req.body.url || null;
  let response = [];

  if (url != null) {
    url = url.split('\n');
    for (let i = 0; i < accounts.length; i++) {
      const doc = await Account.findOne({ name: accounts[i] });

      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({
            account: accounts[i],
            errors: ['قيمة الموقع خاطئة'],
          });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };

        const promises = url.map(async (x, index) => {
          try {
            let tweet_ids;
            const tweetIdRegex = /(?:\/status\/|\/\d+\/status\/)(\d+)/;
            console.log(tweetIdRegex.exec(x));
            tweet_ids = tweetIdRegex.exec(x)[1];
            tweet_ids = tweet_ids.replace('?p=v', '');
            console.log('before send request');
            const ans = await like(c, tweet_ids);
            console.log('after send request');

            // Check if the tweet has already been favorited
            if (ans && ans.data && ans.data.favorite_tweet === 'Done') {
              return ans;
            }
          } catch (error) {
            if (error.message === 'already favorited') {
              return {
                index,
                counter: index + 1,
                error: {
                  type: 'AlreadyFavoritedError',
                  message: 'هذا الاكونت أعجب بهذا التويت من قبل',
                },
              };
            } else if (error.message === 'not found') {
              return {
                index,
                counter: index + 1,
                error: { type: 'NotFoundError', message: 'تويت غير موجود' },
              };
            } else {
              return {
                index,
                counter: index + 1,
                error: {
                  type: 'UnknownError',
                  message: 'حدث خطأ غير متوقع أثناء معالجة طلب الإعجاب',
                },
              };
            }
          }
        });

        const results = await Promise.all(promises);

        console.log('results', results);
        console.log('response', response);
        results.forEach((re) => {
          if (re) {
            const accountIndex = response.findIndex(
              (item) => item.account === accounts[i]
            );

            if (re.error && re.error) {
              if (accountIndex === -1) {
                response.push({
                  account: accounts[i],
                  noOfLike: 0,
                  errors: [{ message: re.error.message, counter: re.counter }],
                });
              } else {
                response[accountIndex].errors.push({
                  message: re.error.message,
                  counter: re.counter,
                });
              }
            } else {
              if (accountIndex !== -1) {
                let counD = response[accountIndex].noOfLike || 0;
                response[accountIndex].noOfLike = counD + 1;
              } else {
                response.push({ account: accounts[i], noOfLike: 1 });
              }
            }
          }
        });
      } else {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({
            account: accounts[i],
            errors: ['يرجى تسجيل الدخول'],
          });
        }
      }
    }
  }
  console.log(response);
  res.status(200).json(response);
});

// @desc    unlike
// @route   POST /api/v1/method/like/delete
// @access  Private

exports.unlikeService = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  let url = req.body.url || null;
  let response = [];

  if (url != null) {
    url = url.split('\n');
    for (let i = 0; i < accounts.length; i++) {
      const doc = await Account.findOne({ name: accounts[i] });

      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({
            account: accounts[i],
            errors: ['قيمة الموقع خاطئة'],
          });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };

        const promises = url.map(async (x, index) => {
          try {
            let tweet_ids;
            const tweetIdRegex = /\/status\/(\d+)\?/;
            tweet_ids = tweetIdRegex.exec(x)[1];
            console.log(tweet_ids);
            tweet_ids = tweet_ids.replace('?p=v', '');
            const ans = await unlike(c, tweet_ids);

            // Check if the tweet has already been favorited
            if (ans && ans.data && ans.data.favorite_tweet === 'Done') {
              return null; // Tweet already favorited, skip
            }
          } catch (error) {
            if (error.message === 'already not favorited') {
              return {
                index,
                counter: index + 1,
                error: {
                  type: 'AlreadyFavoritedError',
                  message: 'هذا التويت ليس من المفضلات لهذا الاكونت',
                },
              };
            } else if (error.message === 'not found') {
              return {
                index,
                counter: index + 1,
                error: { type: 'NotFoundError', message: 'تويت غير موجود' },
              };
            } else {
              return {
                index,
                counter: index + 1,
                error: {
                  type: 'UnknownError',
                  message: 'حدث خطأ غير متوقع أثناء معالجة طلب الإعجاب',
                },
              };
            }
          }
        });

        const results = await Promise.all(promises);

        results.forEach((re) => {
          if (re) {
            const accountIndex = response.findIndex(
              (item) => item.account === accounts[i]
            );

            if (re.error && re.error) {
              if (accountIndex === -1) {
                response.push({
                  account: accounts[i],
                  noOfLike: 0,
                  errors: [{ message: re.error.message, counter: re.counter }],
                });
              } else {
                response[accountIndex].errors.push({
                  message: re.error.message,
                  counter: re.counter,
                });
              }
            } else {
              if (accountIndex !== -1) {
                let counD = response[accountIndex].noOfLike || 0;
                response[accountIndex].noOfLike = counD + 1;
              } else {
                response.push({ account: accounts[i], noOfLike: 1 });
              }
            }
          }
        });
      } else {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({
            account: accounts[i],
            errors: ['يرجى تسجيل الدخول'],
          });
        }
      }
    }
  }
  console.log(response);
  res.status(200).json(response);
});

// @desc    follow
// @route   POST /api/v1/method/follow
// @access  Private

exports.followService = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  let url = req.body.follow || null;
  let response = [];

  if (url != null) {
    for (let i = 0; i < accounts.length; i++) {
      const doc = await Account.findOne({ name: accounts[i] });

      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({
            account: accounts[i],
            errors: ['قيمة الموقع خاطئة'],
          });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };

        const result = await Promise.allSettled(
          url.map(async (x, index) => {
            try {
              return await follow(c, x);
            } catch (error) {
              if (error.message === 'not found') {
                console.log(error.message);
                response.push({
                  account: accounts[index],
                  errors: [`لينك المتابعة خاطئ - رقم الرابط: ${index + 1}`],
                });
                return {
                  error: {
                    type: 'NotFoundError',
                    message: 'المستخدم غير موجود',
                  },
                };
              } else {
                response.push({
                  account: accounts[index],
                  errors: [
                    `حدث خطأ غير متوقع أثناء معالجة طلب المتابعة - رقم الرابط: ${
                      index + 1
                    }`,
                  ],
                });
                return {
                  error: {
                    type: 'UnknownError',
                    message: 'حدث خطأ غير متوقع أثناء معالجة طلب المتابعة',
                  },
                };
              }
            }
          })
        );
        // console.log("reeeeeeeeeeeeeeeeeeeeee",result[0].value);
        // result.forEach((re, index) => {
        //   if (re.status === 'fulfilled' && re.value) {
        //     if (!re.value.error && !re.value.errors) {
        //       let noDelete = response.findIndex(
        //         (item) => item.account === accounts[i]
        //       );
        //       if (noDelete !== -1) {
        //         let counD = response[noDelete].noOfFollow;
        //         response[noDelete].noOfFollow = counD + 1;
        //       } else {
        //         response.push({ account: accounts[i], noOfFollow: 1 });
        //       }
        //     } else {
        //       let noDelete = response.findIndex(
        //         (item) => item.account === accounts[i]
        //       );
        //       if (noDelete === -1) {
        //         response.push({ account: accounts[i], noOfFollow: 0 });
        //       }
        //     }
        //   } else if (re.status === 'rejected' && re.reason && re.reason.error) {
        //     let noDelete = response.findIndex(
        //       (item) => item.account === accounts[i]
        //     );
        //     if (noDelete === -1) {
        //       response.push({
        //         account: accounts[i],
        //         noOfFollow: 0,
        //         errors: [re.reason.error],
        //       });
        //     } else {
        //       response[noDelete].errors.push(re.reason.error);
        //     }
        //   }
        // });
      } else {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({
            account: accounts[i],
            errors: ['يرجى تسجيل الدخول'],
          });
        }
      }
    }
  }
  console.log(response);
  res.status(200).json(response);
});

// @desc    unfollow
// @route   POST /api/v1/method/follow/delete
// @access  Private

exports.unfollowService = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  let url = req.body.follow || null;
  let response = [];
  if (url != null) {
    // url = url.split("\n");
    for (let i = 0; i < accounts.length; i++) {
      const doc = await Account.findOne({ name: accounts[i] });
      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'قيمة الموقع خاطئة' });
        }
      } else if (doc && doc.AccountBasicInfo.Cookie) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        const result = await Promise.allSettled(
          url.map(async (x, index) => {
            try {
              return await unfollow(c, x);
            } catch (error) {
              if (error.message === 'not found') {
                console.log(error.message);
                response.push({
                  account: accounts[index],
                  errors: [`لينك المتابعة خاطئ - رقم الرابط: ${index + 1}`],
                });
                return {
                  error: {
                    type: 'NotFoundError',
                    message: 'المستخدم غير موجود',
                  },
                };
              } else {
                response.push({
                  account: accounts[index],
                  errors: [
                    `حدث خطأ غير متوقع أثناء معالجة طلب المتابعة - رقم الرابط: ${
                      index + 1
                    }`,
                  ],
                });
                return {
                  error: {
                    type: 'UnknownError',
                    message: 'حدث خطأ غير متوقع أثناء معالجة طلب المتابعة',
                  },
                };
              }
            }
          })
        );
        // result.forEach((re) => {
        //   if (re.value) {
        //     if (!re.value.error && !re.value.errors) {
        //       let noDelete = response.findIndex(
        //         (item) => item.account === accounts[i]
        //       );
        //       if (noDelete !== -1) {
        //         let counD = response[noDelete].noOfUnFollow;
        //         response[noDelete].noOfUnFollow = counD + 1;
        //       } else {
        //         response.push({ account: accounts[i], noOfUnFollow: 1 });
        //       }
        //     } else {
        //       let noDelete = response.findIndex(
        //         (item) => item.account === accounts[i]
        //       );
        //       if (noDelete === -1) {
        //         response.push({ account: accounts[i], noOfUnFollow: 0 });
        //       }
        //     }
        //   }
        // });
      } else {
        let found = response.findIndex((item) => item.account === accounts[i]);
        if (found === -1) {
          response.push({ account: accounts[i], errors: 'يرجى تسجيل الدخول' });
        }
      }
    }
  }
  console.log(response);

  res.status(200).json(response);
});
exports.uploadtxtReplyFile = uploadtxtFile('txtFile');

// @desc    reply
// @route   POST /api/v1/method/reply
// @access  Private
exports.replyService = asyncHandler(async (req, res, next) => {
  let response = [];
  if (req.file) {
    const content = req.file.buffer.toString();
    const replies = content.split('/');
    const accounts = req.body.accounts;
    const url = req.body.url;
    let index = -1;
    if (accounts.length > 0 && replies.length > 0) {
      const result = await Promise.allSettled(
        accounts.map(async (x) => {
          if (index < replies.length) {
            const doc = await Account.findOne({ name: x });
            index++;

            if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
              let found = response.findIndex((item) => item.account === x);
              if (found === -1) {
                response.push({
                  account: x,
                  errors: 'قيمة الموقع خاطئة',
                });
              }
              return { error: true };
            } else if (doc && doc.AccountBasicInfo.Cookie) {
              const agent =
                doc.agent === 'mobile'
                  ? doc.AccountBasicInfo?.MobileUserAgent
                  : doc.AccountBasicInfo?.WebUserAgent;

              const c = {
                username: doc.name,
                Proxy: doc.AccountBasicInfo.Location,
                userAgent: agent,
                cookie: doc.AccountBasicInfo.Cookie,
              };
              // const re=replies[index].split("+")
              // console.log(replies[accounts.indexOf(x)]);
              const rep = replies[accounts.indexOf(x)];
              if (rep) {
                return reply(c, rep, url);
              }
              return { error: true };
            } else {
              let found = response.findIndex((item) => item.account === x);
              if (found === -1) {
                response.push({
                  account: x,
                  errors: 'يرجى تسجيل الدخول',
                });
              }
              return { error: true };
            }
          }
        })
      );
      // console.log(JSON.stringify(result));

      result.forEach((re, ind) => {
        //console.log(re);
        if (re.value) {
          if (!re.value.error && !re.value.errors) {
            let noDelete = response.findIndex(
              (item) => item.account === accounts[ind]
            );
            if (noDelete !== -1) {
              let counD = response[noDelete].noOfReply;
              response[noDelete].noOfReply = counD + 1;
            } else {
              response.push({ account: accounts[ind], noOfReply: 1 });
            }
          } else {
            let noDelete = response.findIndex(
              (item) => item.account === accounts[ind]
            );
            if (noDelete === -1) {
              response.push({ account: accounts[ind], noOfReply: 0 });
            }
          }
        }
      });
    } else {
      return next(new ApiError(`عدد الحسابات او الردود يساوي صفر`, 400));
    }
  } else {
    return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
  }
  return res.status(200).send(response);
});

// @desc    resolve
// @route   POST /api/v1/method/resolve
// @access  Private

exports.captcha = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  const type = req.body.type;
  //const headless = req.body.headless;
  const result = await Promise.allSettled(
    accounts.map(async (x) => {
      const doc = await Account.findOne({ name: x });
      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        return { error: true, account: x, message: 'الموقع غير متاح' };
      } else if (
        doc &&
        doc.AccountBasicInfo.Cookie &&
        doc.AccountBasicInfo.Cookie.includes('twid')
      ) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        const resul = await resolveCaptcha(c, type);
        resul.account = doc.name;
        console.log(resul);

        if (!resul.error) {
          //  console.log(resul)

          doc.AccountStatus = AccountStatus.Normal;
          //console.log("resul")
          await doc.save();
        }
        //  console.log(doc)
        return resul;
      } else {
        return { error: true, account: x, message: 'يرجى تسجيل الدخول' };
      }
    })
  );

  if (result) return res.status(200).send(result);
  else {
    return res.status(200).send('failed');
  }
});
exports.viewTweet = asyncHandler(async (req, res, next) => {
  // let tweet_ids = req.body.url
  //  .substring(req.body.url.indexOf("/status/") + "/status/".length)
  //  .replace("?p=v", "");
  //let username = req.body.url.substring(req.body.url.indexOf(".com/") + 5);
  //username = username.substring(0, username.indexOf("/status/"));
  const result = await Promise.allSettled(
    req.body.accounts.map(async (x) => {
      const doc = await Account.findOne({ name: x });
      if (doc && doc.AccountStatus == AccountStatus.NetworkError) {
        return { error: true, account: x, message: 'الموقع غير متاح' };
      } else if (
        doc &&
        doc.AccountBasicInfo.Cookie &&
        doc.AccountBasicInfo.Cookie.includes('twid')
      ) {
        const agent =
          doc.agent === 'mobile'
            ? doc.AccountBasicInfo?.MobileUserAgent
            : doc.AccountBasicInfo?.WebUserAgent;

        const c = {
          username: doc.name,
          Proxy: doc.AccountBasicInfo.Location,
          userAgent: agent,
          cookie: doc.AccountBasicInfo.Cookie,
        };
        await ShowTweet(c, req.body.url);

        return '';
      } else {
        return { error: true, account: x, message: 'يرجى تسجيل الدخول' };
      }
    })
  );
  if (result) return res.status(200).send(result);
  else {
    return res.status(200);
  }
});
