const fs = require('fs');
const { parse } = require('csv-parse');
const { Worker } = require('worker_threads');
const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const Account = require('../model/accountModel');
const InsAccount = require('../model/instaModel');
const ApiError = require('../utils/apiError');
const path = require('path');
const axios = require('axios');
const {
  uploadCSVFile,
  uploadtxtFile,
} = require('../middleware/uploadFilesMiddleware');
const { log } = require('console');
const { requestAxios } = require('../twitterMethod/twitterMethods');
const { uploadMedia } = require('../twitterMethod/uploadMedia');

// @desc    Get list of accounts
// @route   GET /api/v1/accounts
// @access  Private
exports.getAccounts = factory.getAll(Account, 'Categories');
// exports.getAccounts = factory.getCategoriesWithAccounts(Account);
// exports.getAccountsWithCategory = factory.getAllWithCategory(Account);

exports.getAccountsForInsta = factory.getAll(InsAccount);

// @desc    Get specific account by id
// @route   GET /api/v1/accounts/:id
// @access  Private
exports.getAccount = factory.getOne(Account);

// @desc    Create account
// @route   POST  /api/v1/accounts
// @access  Private/Admin
exports.createAccount = factory.createOne(Account);

// @desc    Update specific account
// @route   PUT /api/v1/accounts/:id
// @access  Private/Admin
exports.newUpadteAccount = async (req, res) => {
  const { Category, profileImg,bannerImage, name, description, employeeUser,location } = req.body;
  const  accountId = req.params.id;
  const errorsMessages = []

  console.log(req.body);

  const account = await Account.findById(accountId);
  const accountData = {
    name: account.name,
    cookie: account.AccountBasicInfo.Cookie,  // استخراج Cookie من AccountBasicInfo
  };
  let resUpdateImage;
  try {
    if (profileImg) {
      console.log("enter image condition ");
      const base64Image = await uploadMedia(account, profileImg); // Assuming uploadMedia returns a Base64 string.
      const param = { 'image': base64Image };
       resUpdateImage = await requestAxios(
        accountData,
        'updateImage',
        "https://api.x.com/1.1/account/update_profile_image.json",
        'post',
        param,
        true
      );
      if (resUpdateImage.error) {
        errorsMessages.push({status:500,message:resUpdateImage.error})
      }
    }

    if (bannerImage) {
      console.log("enter bannerImage condition ");
      const base64Image = await uploadMedia(account, bannerImage); // Assuming uploadMedia returns a Base64 string.
      const param = { 'banner': base64Image };
       resUpdateImage = await requestAxios(
        accountData,
        'updateImage',
        "https://api.x.com/1.1/account/update_profile_banner.json",
        'post',
        param,
        true
      );
      if (resUpdateImage?.error) {
        errorsMessages.push(resUpdateImage?.error)
      }
    }

    if (name || description || location) {
      let param = {}
      console.log("enter name & description condition ");
      if (name) param.name = name;
      if (description) param.description = description;
      if (location) param.location = location;

      const resUpdateProfile = await requestAxios(
        accountData,
        'updateProfile',
        "https://api.x.com/1.1/account/update_profile.json",
        'post',
        param,
        true
      );

      if (Category || employeeUser) {
        const updateAccount = await Account.findByIdAndUpdate(
          accountId,
          {
            $set: {
              Category,
              employeeUser
            }
          },
          { new: true } // Option to return the updated document
        );
      }

      // التعامل مع الاستجابة هنا إذا لزم الأمر
      if (resUpdateProfile?.error) {
        errorsMessages.push(resUpdateImage?.error)
      }
    }
    if(errorsMessages.length > 0){
      return res.status(500).json(errorsMessages)
    }
    // إرجاع استجابة ناجحة
    return res.status(200).json({ message: "Account updated successfully" });

  } catch (error) {
    console.error('Error updating account:', error);
    return res.status(500).json({ error: 'An error occurred while updating the account' });
  }
};


exports.updateAccount = factory.updateOne(Account);

// @desc    Delete specific account
// @route   DELETE /api/v1/accounts/:id
// @access  Private/Admin
exports.deleteAccount = factory.deleteOne(Account);

exports.uploadimportFile = uploadCSVFile('csvFile');

// @desc    import accounts
// @route   POST /api/v1/accounts/import
// @access  Private/Admin/manager
exports.importAccount = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const accounts = [];
    //let path = "./uploads/csv/" + req.file.filename;
    let content = req.file.buffer.toString();
    //content = content.replace(/^/gm, ",");
    // content = content
    //   .split("\n")
    //   .map((s) => "a," + s)
    //   .join("\n");
    // console.log(content);
    //fs.createReadStream(content)
    // .pipe(
    parse(content, {
      columns: true,
      delimiter: ',',
      relax_quotes: true,
      bom: true,
      'ignore empty': true,
    })
      // )
      .on('error', (error) => {
        next(new ApiError(`${error.message} يوجد خطأ في قراءة الملف `, 404));
      })
      .on('data', (row) => {
        const AccountBasicInfo = {};
        if (row.MailPassword && row.MailPassword !== '')
          AccountBasicInfo.MailPassword = row.MailPassword;
        if (row.MailServer && row.MailServer !== '')
          AccountBasicInfo.MailServer = row.MailServer;
        if (row.MailPort && row.MailPort !== '')
          AccountBasicInfo.MailPort = row.MailPort;
        if (row.Proxy && row.Proxy !== '') {
          const arr = row.Proxy.split(':');
          if (arr.length === 4) AccountBasicInfo.Location = row.Proxy;
        }
        if (row.MobileUserAgent && row.MobileUserAgent !== '')
          AccountBasicInfo.MobileUserAgent = row.MobileUserAgent;
        if (row.WebUserAgent && row.WebUserAgent !== '')
          AccountBasicInfo.WebUserAgent = row.WebUserAgent;
        if (row.FACode && row.FACode !== '')
          AccountBasicInfo.FaKey = row.FACode;
        if (row.SecretKey && row.SecretKey !== '')
          AccountBasicInfo.SecretKey = row.SecretKey;
        if (row.Cookies && row.Cookies !== '') {
          if (row.Cookies.includes('twid'))
            AccountBasicInfo.Cookie = row.Cookies;
        }
        if (row.ConsumerKey && row.ConsumerKey !== '')
          AccountBasicInfo.ConsumerKey = row.ConsumerKey;
        if (row.ConsumerSecret && row.ConsumerSecret !== '')
          AccountBasicInfo.ConsumerSecret = row.ConsumerSecret;
        if (row.AccessToken && row.AccessToken !== '')
          AccountBasicInfo.AccessToken = row.AccessToken;
        if (row.AccessTokenSecret && row.AccessTokenSecret !== '')
          AccountBasicInfo.AccessTokenSecret = row.AccessTokenSecret;
        const account = {};
        //console.log("Username");
        //console.log(row["Username"]);
        if (row.Username && row.Username !== '') {
          account.name = row.Username;
        }
        if (row.Password && row.Password !== '')
          account.password = row.Password;
        if (row.Email && row.Email !== '') account.email = row.Email;
        if (row.Phone && row.Phone !== '') account.phone = row.Phone;
        account.AccountBasicInfo = AccountBasicInfo;
        account.Category = req.body.Category;
        account.employeeUser = req.body.employeeUser;

        accounts.push(account);
      })
      .on('end', async () => {
        let insertedDocuments = [];
        let failedInsertions = [];
        let insertedCount = 0;
        for (let i = 0; i < accounts.length; i++) {
          await Account.create(accounts[i])
            .then((result) => {
              insertedCount += 1;
              insertedDocuments.push(result);
              console.log('Created' + result);
            })
            .catch((error) => {
              console.log('Created' + error);

              if (error.name === 'ValidationError') {
                const message =
                  'تأكد من صحة الإيميل و الباسورد في الحساب رقم ' + (i + 1);

                failedInsertions.push({ error: message });
              } else if (error.code === 11000) {
                if (error.errmsg[64] === 'n' && error.errmsg[65] === 'a') {
                  const name = error.errmsg.split('"');
                  const msg = name[1] + ' : هذا الأسم مستخدم من قبل';
                  failedInsertions.push({ error: msg });
                }
                if (error.errmsg[64] === 'e' && error.errmsg[65] === 'm') {
                  const email = error.errmsg.split('"');
                  const msg = email[1] + ' : هذا الإيميل مستخدم من قبل ';
                  failedInsertions.push({ error: msg });
                }
                if (error.errmsg[64] === 'p' && error.errmsg[65] === 'h') {
                  const phone = error.errmsg.split('"');
                  const msg = phone[1] + ' : هذا الهاتف مستخدم من قبل ';
                  failedInsertions.push({ error: msg });
                }
              } else {
                failedInsertions.push({ error: error });
              }
            });
        }
        res.status(201).send({
          insertedCount: insertedCount,
          insertedDocuments: insertedDocuments,
          failed: failedInsertions.length,
          failedErrors: failedInsertions,
        });
      });
  } else {
    return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
  }
});

exports.importAccountForInsta = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const accounts = [];
    //let path = "./uploads/csv/" + req.file.filename;
    let content = req.file.buffer.toString();
    //content = content.replace(/^/gm, ",");
    // content = content
    //   .split("\n")
    //   .map((s) => "a," + s)
    //   .join("\n");
    // console.log(content);
    //fs.createReadStream(content)
    // .pipe(
    parse(content, {
      columns: true,
      delimiter: ',',
      relax_quotes: true,
      bom: true,
      'ignore empty': true,
    })
      // )
      .on('error', (error) => {
        next(new ApiError(`${error.message} يوجد خطأ في قراءة الملف `, 404));
      })
      .on('data', (row) => {
        const AccountBasicInfo = {};
        if (row.MailPassword && row.MailPassword !== '')
          AccountBasicInfo.MailPassword = row.MailPassword;
        if (row.MailServer && row.MailServer !== '')
          AccountBasicInfo.MailServer = row.MailServer;
        if (row.MailPort && row.MailPort !== '')
          AccountBasicInfo.MailPort = row.MailPort;
        if (row.Proxy && row.Proxy !== '') {
          const arr = row.Proxy.split(':');
          if (arr.length === 4) AccountBasicInfo.Location = row.Proxy;
        }
        if (row.MobileUserAgent && row.MobileUserAgent !== '')
          AccountBasicInfo.MobileUserAgent = row.MobileUserAgent;
        if (row.WebUserAgent && row.WebUserAgent !== '')
          AccountBasicInfo.WebUserAgent = row.WebUserAgent;
        if (row.FACode && row.FACode !== '')
          AccountBasicInfo.FaKey = row.FACode;
        if (row.Cookies && row.Cookies !== '') {
          if (row.Cookies.includes('twid'))
            AccountBasicInfo.Cookie = row.Cookies;
        }
        if (row.ConsumerKey && row.ConsumerKey !== '')
          AccountBasicInfo.ConsumerKey = row.ConsumerKey;
        if (row.ConsumerSecret && row.ConsumerSecret !== '')
          AccountBasicInfo.ConsumerSecret = row.ConsumerSecret;
        if (row.AccessToken && row.AccessToken !== '')
          AccountBasicInfo.AccessToken = row.AccessToken;
        if (row.AccessTokenSecret && row.AccessTokenSecret !== '')
          AccountBasicInfo.AccessTokenSecret = row.AccessTokenSecret;
        const account = {};
        //console.log("Username");
        //console.log(row["Username"]);
        if (row.Username && row.Username !== '') {
          account.name = row.Username;
        }
        if (row.Password && row.Password !== '')
          account.password = row.Password;
        if (row.Email && row.Email !== '') account.email = row.Email;
        if (row.Phone && row.Phone !== '') account.phone = row.Phone;
        account.AccountBasicInfo = AccountBasicInfo;
        account.Category = req.body.Category;
        account.employeeUser = req.body.employeeUser;

        accounts.push(account);
      })
      .on('end', async () => {
        let insertedDocuments = [];
        let failedInsertions = [];
        let insertedCount = 0;
        for (let i = 0; i < accounts.length; i++) {
          await InsAccount.create(accounts[i])
            .then((result) => {
              insertedCount += 1;
              insertedDocuments.push(result);
            })
            .catch((error) => {
              console.log(error);
              if (error.name === 'ValidationError') {
                const message =
                  'تأكد من صحة الإيميل و الباسورد في الحساب رقم ' + (i + 1);

                failedInsertions.push({ error: message });
              } else if (error.code === 11000) {
                if (error.errmsg[67] === 'n' && error.errmsg[68] === 'a') {
                  const name = error.errmsg.split('"');
                  const msg = name[1] + ' : هذا الأسم مستخدم من قبل';
                  failedInsertions.push({ error: msg });
                }
                if (error.errmsg[67] === 'e' && error.errmsg[68] === 'm') {
                  const email = error.errmsg.split('"');
                  const msg = email[1] + ' : هذا الإيميل مستخدم من قبل ';
                  failedInsertions.push({ error: msg });
                }
                if (error.errmsg[67] === 'p' && error.errmsg[68] === 'h') {
                  const phone = error.errmsg.split('"');
                  const msg = phone[1] + ' : هذا الهاتف مستخدم من قبل ';
                  failedInsertions.push({ error: msg });
                }
              } else {
                failedInsertions.push({ error: error });
              }
            });
        }
        res.status(201).send({
          insertedCount: insertedCount,
          insertedDocuments: insertedDocuments,
          failed: failedInsertions.length,
          failedErrors: failedInsertions,
        });
      });
  } else {
    return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
  }
});

////////binding proxy

exports.uploadtxtProxyFile = uploadtxtFile('txtFile');

// @desc    binding proxies
// @route   POST /api/v1/accounts/binding
// @access  Private/Admin/manager
exports.bindingProxy = asyncHandler(async (req, res, next) => {
  var numberofupdatedAccounts = 0;
  if (req.file) {
    const content = req.file.buffer.toString();
    const proxies = content.split('\n');
    const accounts = req.body.accounts;
    if (accounts.length > 0 && proxies.length > 0) {
      if (req.body.clear == 'true') {
        var i1 = 0;
        var i2 = 0;
        while (true) {
          if (i1 == accounts.length) {
            break;
          }
          if (i2 == proxies.length) {
            if (req.body.loopBind == 'true') {
              i2 = 0;
            } else {
              break;
            }
          }
          const doc = Account.findOneAndUpdate(
            {
              name: accounts[i1],
            },
            {
              'AccountBasicInfo.Location': proxies[i2],
            },
            {
              new: true,
            }
          ).exec();
          let c;
          await doc.then((docc) => {
            if (docc) {
              i2 += 1;
              numberofupdatedAccounts += 1;
            }
          });

          //
          i1 += 1;
        }
      } else {
        let i1 = 0;
        let i2 = 0;
        while (true) {
          if (i1 == accounts.length) {
            break;
          }
          if (i2 == proxies.length) {
            if (req.body.loopBind == 'true') {
              i2 = 0;
            } else {
              break;
            }
          }
          const doc = Account.findOneAndUpdate(
            {
              name: accounts[i1],
              'AccountBasicInfo.Location': '',
            },
            {
              'AccountBasicInfo.Location': proxies[i2],
            },
            {
              new: true,
            }
          ).exec();
          await doc.then((docc) => {
            if (docc) {
              i2 += 1;
              numberofupdatedAccounts += 1;
            }
          });

          //
          i1 += 1;
        }
      }
    } else {
      return next(new ApiError(`عدد الحسابات او البروكسيات يساوي صفر`, 400));
    }
  } else {
    return next(new ApiError(`الرجاء قم بتحميل الملف`, 400));
  }
  return res.status(200).send({
    updatedAccount: numberofupdatedAccounts,
  });
});
/////check accounts
// @desc    check accounts
// @route   POST /api/v1/accounts/check
// @access  Private
exports.check = asyncHandler(async (req, res, next) => {
  const response = [];
  console.log('req.body.accounts');
  console.log(req.body.accounts);
  console.log('req.body.accounts');

  const thread = new Worker(
    path.join(__dirname, '../twitterMethod/checkWorker.js'),
    {
      workerData: {
        accounts: req.body.accounts,
        userAgent: req.body.userAgent,
        clear: req.body.clear || true,
        // clearcookie: req.body.clearcookie,
      },
    }
  );

  thread.on('message', (data) => {
    response.push(data);
    console.log(data);
    console.log(
      '🚀 ~ thread.on LOOOOOKKK HEEEEEEEEEEEEEEEEEEEEEEEEERR~ response:',
      response
    );
    if (response.length === req.body.accounts.length) {
      thread.terminate();
      return res.status(200).send({
        data: response,
      });
    }
  });

  thread.on('error', (err) => {
    next(new ApiError(`هناك مشكلة ${err}`, 400));
  });
});

/////data accounts
// @desc    data accounts
// @route   POST /api/v1/accounts/data
// @access  Private
exports.accountData = asyncHandler(async (req, res, next) => {
  const response = [];
  const thread = new Worker( path.join(__dirname, '../twitterMethod/accountDataWorker.js'), {
    workerData: {
      accounts: req.body.accounts,
    },
  });

  thread.on('message', (data) => {
    response.push(data);
    if (response.length === req.body.accounts.length) {
      thread.terminate();
      return res.status(200).send({
        data: response,
      });
    }
  });

  thread.on('error', (err) => {
    next(new ApiError(`هناك مشكلة ${err}`, 400));
  });
});
/////delete set of accounts
// @desc    data accounts
// @route   POST /api/v1/accounts/delete
// @access  Private
exports.deleteAccountSet = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  await Account.deleteMany({ _id: { $in: accounts } });

  res.status(204).send();
});

exports.deleteInstaAccountSet = asyncHandler(async (req, res, next) => {
  const accounts = req.body.accounts;
  await InsAccount.deleteMany({ _id: { $in: accounts } });

  res.status(204).send();
});
