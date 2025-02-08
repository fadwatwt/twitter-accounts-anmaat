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

  for (let i = 0; i < accounts.length; i += 1) {
    const query = Account.findOne({ name: accounts[i] }).exec();
    query
      .then((account) => {
        if (account && account.AccountBasicInfo.Cookie) {
          const agent =
            account.agent === 'mobile'
              ? account.AccountBasicInfo?.MobileUserAgent
              : account.AccountBasicInfo?.WebUserAgent;
          //////////check if proxy is available
          let proxy = account.AccountBasicInfo?.Location;

          if (proxy !== '') {
            const proxyArr = proxy.split(':');
            const ip = proxyArr[0];
            const port = proxyArr[1];
            const username = proxyArr[2];
            const password = proxyArr[3];
            proxy = username + ':' + password + '@' + ip + ':' + port;

            proxyCheck(proxy)
              .then((r) => {
                const c = {
                  username: account.name,
                  Proxy: account.AccountBasicInfo.Location,
                  userAgent: agent,
                  cookie: account.AccountBasicInfo.Cookie,
                  SecretKey: account.AccountBasicInfo.SecretKey || '',
                };
                accountDataInfo(c).then((response) => {
                  // console.log(response);
                  if (!response.error) {
                    const updateCookies = Account.findOneAndUpdate(
                      { name: accounts[i] },
                      response,
                      { new: true }
                    ).exec();

                    updateCookies
                      .then((doc) => {
                        //console.log(doc)
                        if (doc) {
                          parentPort.postMessage({
                            status: true,
                            account: accounts[i],
                            data: response,
                          });
                        }
                      })
                      .catch((err) => {
                        //console.error(err);
                        parentPort.postMessage({
                          status: false,
                          account: accounts[i],
                          message:
                            accounts[i] +
                            'هناك مشكلة في حفظ البيانات في قاعدة البيانات ',
                        });
                      });
                  } else {
                    parentPort.postMessage({
                      status: false,
                      account: accounts[i],
                      message: response.error.errors[0].message,
                    });
                  }
                });
              })
              .catch((e) => {
                //console.error(AccountStatus.NetworkError);
                const updateStutus = Account.findOneAndUpdate(
                  { name: accounts[i] },
                  { AccountStatus: AccountStatus.NetworkError },
                  { new: true }
                )
                  .exec()
                  .then((doc) => {
                    //console.log(doc);
                    parentPort.postMessage({
                      status: false,
                      account: accounts[i],
                      message:
                        accounts[i] + '  فشل تحديث البيانات الموقع غير متاح',
                    });
                  })
                  .catch((err) => {
                    //console.error(err);
                    parentPort.postMessage({
                      status: false,
                      account: accounts[i],
                      message:
                        accounts[i] + '  فشل تحديث البيانات الموقع غير متاح',
                    });
                  });

                ///console.error(e); // ECONNRESET
              });
          } else {
            /////////////////////////
            const c = {
              username: account.name,
              Proxy: account.AccountBasicInfo.Location,
              userAgent: agent,
              cookie: account.AccountBasicInfo.Cookie,
            };
            accountDataInfo(c).then((response) => {
              // console.log(response);
              if (!response.error) {
                const updateCookies = Account.findOneAndUpdate(
                  { name: accounts[i] },
                  response,
                  { new: true }
                ).exec();

                updateCookies
                  .then((doc) => {
                    if (doc) {
                      parentPort.postMessage({
                        status: true,
                        account: accounts[i],
                        data: response,
                      });
                    }
                  })
                  .catch((err) => {
                    console.error(err);
                    parentPort.postMessage({
                      status: false,
                      account: accounts[i],
                      message:
                        accounts[i] +
                        'هناك مشكلة في حفظ البيانات في قاعدة البيانات ',
                    });
                  });
              } else {
                parentPort.postMessage({
                  status: false,
                  account: accounts[i],
                  message: response.error.errors[0].message,
                });
              }
            });
          }
        } else {
          parentPort.postMessage({
            status: false,
            account: accounts[i],
            message: ' الرجاء تسجيل الدخول',
          });
        }
      })
      .catch((err) => {
        parentPort.postMessage({
          status: false,
          account: accounts[i],
          message: err.message,
        });
      });
  }
} catch (e) {
  // console.log(e);
}
