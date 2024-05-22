const { workerData, parentPort } = require('worker_threads');
const { login } = require('./check');
const { getTimline, accountDataInfo } = require('./twitterMethods');

const dbConnection = require('../config/database');
const proxyCheck = require('../utils/checkProxy');
const AccountCategory = require('../model/accountCategoryModel');
const user = require('../model/userModel');
const { AccountStatus } = require('../model/AccountStatusModel');

const Account = require('../model/accountModel');

try {
  dbConnection();

  const accounts = workerData.accounts;
  const userAgent = workerData.userAgent;
  const clear = workerData.clear;

  for (let i = 0; i < accounts.length; i += 1) {
    const query = Account.findOne({ name: accounts[i].name }).exec();
    query
      .then((account) => {
        console.log('The following account is from CheckWorker.js component');
        console.log('account', account);
        if (account) {
          const agent =
            userAgent === 'mobile'
              ? account.AccountBasicInfo?.MobileUserAgent
              : account.AccountBasicInfo?.WebUserAgent;
          //////////check if proxy is available
          let proxy = account.AccountBasicInfo?.Location;
          console.log('proxy', proxy);
          if (proxy !== '') {
            const proxyArr = proxy.split(':');
            const ip = proxyArr[0];
            const port = proxyArr[1];
            const username = proxyArr[2];
            const password = proxyArr[3];
            const p = username + ':' + password + '@' + ip + ':' + port;
            console.log('p', p);

            proxyCheck(p)
              .then((r) => {
                console.log('then LOGIN');
                console.log(r);
                login(
                  account.name,
                  account.password,
                  agent,
                  accounts[i].cookies,
                  account.AccountBasicInfo.Location,
                  account.email || '',
                  account.phone || ''
                ).then((response) => {
                  console.log('response');
                  console.log(response);
                  if (response.success) {
                    console.log(response.success);
                    console.log('response.success');
                    const cookies = response.cookies.get('cookie');
                    if (clear) {
                      console.log('clear');
                      const updateCookies = Account.findOneAndUpdate(
                        { name: accounts[i].name },
                        {
                          'AccountBasicInfo.Cookie': cookies,
                          agent: userAgent,
                        },
                        { new: true }
                      ).exec();

                      updateCookies
                        .then((doc) => {
                          console.log('doc');
                          console.log("تسجيل الدخول بنجاح'");
                          if (doc) {
                            parentPort.postMessage({
                              status: true,
                              user: accounts[i].name,
                              message: accounts[i].name + ' تسجيل الدخول بنجاح',
                              location: response.location,
                              followers: response.followers_count,
                              following: response.friends_count,
                              description: response.description,
                              response,
                            });
                          }
                        })
                        .catch((err) => {
                          console.error(err);
                          parentPort.postMessage({
                            status: false,
                            message:
                              response.cookies.get('username') +
                              'هناك مشكلة في حفظ الكوكيز في قاعدة البيانات ',
                          });
                        });
                    } else {
                      parentPort.postMessage({
                        status: true,
                        user: accounts[i].name,
                        message: accounts[i].name + ' تسجيل الدخول بنجاح',
                        location: response.location,
                        followers: response.followers_count,
                        following: response.friends_count,
                        description: response.description,
                        response,
                      });
                    }
                  } else {
                    const status = response.status;

                    const updateCookies = Account.findOneAndUpdate(
                      { name: accounts[i].name },
                      { AccountStatus: status }
                    ).exec();

                    updateCookies
                      .then((doc) => {
                        if (doc) {
                          parentPort.postMessage({
                            status: false,
                            user: accounts[i].name,
                            message: response.message,
                          });
                        }
                      })
                      .catch((err) => {
                        console.error(err);
                        parentPort.postMessage({
                          status: false,
                          user: accounts[i].name,
                          message:
                            accounts[i].name +
                            'هناك مشكلة في حفظ الحالة في قاعدة البيانات ',
                        });
                      });
                  }
                });
              })
              .catch((e) => {
                //console.error(AccountStatus.NetworkError);
                console.log('failed to login site is not available');
                console.log(e);
                console.log(e);
                console.log(e);
                console.log(e);
                console.log(e);
                const updateStutus = Account.findOneAndUpdate(
                  { name: accounts[i].name },
                  { AccountStatus: AccountStatus.NetworkError },
                  { new: true }
                )
                  .exec()
                  .then((doc) => {
                    console.log('doc');
                    console.log(doc);
                    parentPort.postMessage({
                      status: false,
                      message:
                        accounts[i].name + '   تسجيل الدخول الموقع غير متاح',
                    });
                  })
                  .catch((err) => {
                    console.error('err');
                    console.error(err);
                    parentPort.postMessage({
                      status: false,
                      message:
                        accounts[i].name + '  فشل تسجيل الدخول الموقع غير متاح',
                    });
                  });

                console.error(e); // ECONNRESET
              });
          } else {
            login(
              account.name,
              account.password,
              agent,
              accounts[i].cookies,
              account.AccountBasicInfo.Location,
              account.email || '',
              account.phone || ''
            ).then((response) => {
              if (response.success) {
                const cookies = response.cookies.get('cookie');
                if (clear) {
                  const updateCookies = Account.findOneAndUpdate(
                    { name: accounts[i].name },
                    { 'AccountBasicInfo.Cookie': cookies, agent: userAgent }
                  ).exec();

                  updateCookies
                    .then((doc) => {
                      if (doc) {
                        parentPort.postMessage({
                          status: true,
                          user: accounts[i].name,
                          message: accounts[i].name + ' تسجيل الدخول بنجاح',
                        });
                      }
                    })
                    .catch((err) => {
                      //console.error(err);
                      parentPort.postMessage({
                        status: false,
                        message:
                          response.cookies.get('username') +
                          'هناك مشكلة في حفظ الكوكيز في قاعدة البيانات ',
                      });
                    });
                } else {
                  parentPort.postMessage({
                    status: true,
                    user: accounts[i].name,
                    message: accounts[i].name + ' تسجيل الدخول بنجاح',
                  });
                }
              } else {
                const status = response.status;

                const updateCookies = Account.findOneAndUpdate(
                  { name: accounts[i].name },
                  { AccountStatus: status }
                ).exec();

                updateCookies
                  .then((doc) => {
                    if (doc) {
                      parentPort.postMessage({
                        status: false,
                        user: accounts[i].name,
                        message: response.message,
                      });
                    }
                  })
                  .catch((err) => {
                    // console.error(err);
                    parentPort.postMessage({
                      status: false,
                      user: accounts[i].name,
                      message:
                        accounts[i].name +
                        'هناك مشكلة في حفظ الحالة في قاعدة البيانات ',
                    });
                  });
              }
            });
          }
        } else {
          parentPort.postMessage({
            status: false,
            message: accounts[i].name + ' لايوجد حساب بهذا الاسم',
          });
        }
      })
      .catch((err) => {
        parentPort.postMessage({
          status: false,
          message: accounts[i].name + ' ' + err.message,
        });
      });
  }
} catch (e) {
  // console.log(e);
}
