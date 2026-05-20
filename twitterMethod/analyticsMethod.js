const axios = require('axios');
const setCookie = require('set-cookie-parser');
const { HttpsProxyAgent } = require('https-proxy-agent');
const Account = require('../model/accountModel');
const puppeteer = require('puppeteer');

async function requestAxios(account, url, method = 'get', data = {}) {
  //console.log(account);

  let result = {};
  const cookie = account.cookie || '';

  //   const splitCookieHeaders = setCookie.splitCookiesString(cookie);
  //   const cookies = setCookie.parse(splitCookieHeaders);
  //   //console.log(cookies);
  //   const guestToken = cookies[0]["guest_id"] || "";
  //   const csrf = cookies[0]["ct0"] || "";
  //   const authType = cookies[0]["auth_token"] ? "OAuth2Session" : "";
  const userAgent = account.userAgent || '';
  let proxy = account.Proxy || '';
  const headers = {
    'User-Agent': userAgent,
    'Accept-Encoding': 'gzip, deflate, br',
    Cookie: cookie,
    accept: 'application/json, text/javascript, */*; q=0.01',
    Referrer: 'https://analytics.twitter.com/user/ayatmhd54/home',
  };
  let axiosConfig = {
    url,
    headers: headers,
    //params: params,
    method: method,
    // adapter: http2Adapter,
  };
  if (method != 'get') {
    axiosConfig.data = data;
  }
  if (proxy !== '') {
    proxy = proxy.split(':');
    const ip = proxy[0];
    const port = proxy[1];
    const username = proxy[2];
    const password = proxy[3];
    const httpsAgent = new HttpsProxyAgent(
      'http://' + username + ':' + password + '@' + ip + ':' + port
    );

    axiosConfig.httpsAgent = httpsAgent;
    axiosConfig.proxy = false;
  }
  let response = {};
  //console.log(axiosConfig);
  try {
    response = await axios(axiosConfig);
  } catch (err) {
    //console.log("catch");

    //console.log(err.response?.data?.errors);
    //console.log(err);
    result.error = err.response?.data || err.message;

    return result;
  }

  if (response?.status === 200) {
    const coo = setCookie.parse(response);

    const cookieString = coo
      .map(({ name, value }) => `${name}=${value};`)
      .join(' ');

    // result.cookie = cookieString;
    //result.key = key;
    result = response.data;
    // console.log(result);
    return result;
  }

  return result;
}

exports.activateAnalytics = async (account) => {
  let browser;
  let username;
  let password;
  if (account.Proxy !== '') {
    const proxy = account.Proxy.split(':');
    const ip = proxy[0];
    const port = proxy[1];
    username = proxy[2];
    password = proxy[3];
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--proxy-server=' + ip + ':' + port,
        '--proxy-auth=' + username + ':' + password,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
  } else {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  const page = await browser.newPage();
  if (account.proxy !== '') {
    await page.authenticate({ username: username, password: password });
  }
  await page.setUserAgent(account.userAgent);
  let splittedPairs = account.cookie.split(';');

  let cookies = setCookie.parse(splittedPairs);
  cookies = cookies.map(async (cook) => {
    const ob = { name: cook.name.trim(), value: cook.value.trim() };
    ob.domain = '.twitter.com';
    await page.setCookie(ob);

    return ob;
  });
  /// console.log(cookies);

  await page.goto('https://analytics.twitter.com/about');
  await Promise.all([
    page.waitForNavigation(),
    page.click('.sign-in'), // trigger a navigation
  ]);
  await Account.findOneAndUpdate(
    { name: account.username },
    { analytics: true }
  );
  await browser.close();
  // await page.screenshot({ path: "uploads/example.png" });
};

exports.getAnalytics = async (account) => {
  let now = new Date();
  const lastweek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDay() - 28

    // now.getUTCMinutes
  );
  // console.log("date");
  now.setUTCHours(0);
  now.setUTCMinutes(0);
  now.setUTCSeconds(0);
  now.setUTCMilliseconds(0);
  ///
  lastweek.setUTCHours(0);
  lastweek.setUTCMinutes(0);
  lastweek.setUTCSeconds(0);
  lastweek.setUTCMilliseconds(0);
  ///console.log(Date.parse(now));
  ///console.log(now);
  ///console.log(Date.parse(lastweek));
  //console.log(lastweek);
  const end = Date.parse(now);
  const start = Date.parse(lastweek);

  const url =
    'https://analytics.twitter.com/user/' +
    account.username +
    '/home/summary.json?start_time=' +
    start +
    '&end_time=' +
    end;
  //console.log(url);
  return requestAxios(account, url);
};
function ISODateString(d) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}
