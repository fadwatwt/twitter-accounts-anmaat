const axios = require('axios');
const setCookie = require('set-cookie-parser');
const { HttpsProxyAgent } = require('https-proxy-agent');

const { uploadMedia } = require('./uploadMedia');

async function requestAxios(account, key, url, method = 'get', data = {}) {
  //console.log(account);

  let result = {};
  const cookie = account.cookie || '';

  const splitCookieHeaders = setCookie.splitCookiesString(cookie);
  const cookies = setCookie.parse(splitCookieHeaders);
  //console.log(cookies);
  const guestToken = cookies[0]['guest_id'] || '';
  const csrf = cookies[0]['ct0'] || '';
  const authType = cookies[0]['auth_token'] ? 'OAuth2Session' : '';
  const userAgent = account.userAgent || '';
  let proxy = account.Proxy || '';

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization:
      'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
    'x-guest-token': guestToken,
    'x-csrf-token': csrf,
    'x-twitter-auth-type': authType,
    'User-Agent': userAgent,
    Cookie: cookie,
    Referer: url,
  };
  let axiosConfig = {
    url,
    headers: headers,
    //params: params,
    method: method,
    data: data,
  };
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
    // console.log(err.response);
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

exports.updateProfileImage = async (account, file) => {
  const upload = await uploadMedia(account, file);
  if (upload.error) return upload;
  const url = 'https://twitter.com/i/api/1.1/account/update_profile_image.json';
  const params = new URLSearchParams({ media_id: upload });
  const update = requestAxios(account, '', url, 'post', params);
  return update;
};
exports.updateProfileBanner = async (account, file) => {
  const upload = await uploadMedia(account, file);
  if (upload.error) return upload;
  const url = 'https://api.twitter.com/1.1/account/update_profile_banner.json';
  const params = new URLSearchParams({ media_id: upload });
  const update = requestAxios(account, '', url, 'post', params);
  return update;
};
exports.updateProfileInfo = async (account, profile) => {
  //console.log("profile")
  //console.log(profile)

  const params = new URLSearchParams(profile);
  const url = 'https://twitter.com/i/api/1.1/account/update_profile.json';
  const update = await requestAxios(account, '', url, 'post', params);
  //console.log(JSON.stringify(update))
  return update;
};

exports.updatePassword = async (account, newPass, oldPass) => {
  // console.log("password");
  let params = {
    current_password: oldPass,
    password: newPass,
    password_confirmation: newPass,
  };
  params = new URLSearchParams(params);
  const url = 'https://twitter.com/i/api/i/account/change_password.json';
  const update = await requestAxios(account, '', url, 'post', params);
  //console.log(update);
  //console.log("update");
  // console.log(update.error?.errors);
  return update;
};

exports.updateScreenName = async (account, name) => {
  // console.log("screanname");
  let params = {
    include_mention_filter: true,
    passwinclude_nsfw_user_flag: true,
    include_nsfw_admin_flag: true,
    include_ranked_timeline: true,
    include_alt_text_compose: true,
    screen_name: name,
    lang: 'ar',
  };
  params = new URLSearchParams(params);
  const url = 'https://api.twitter.com/1.1/account/settings.json';
  const update = await requestAxios(account, '', url, 'post', params);
  //console.log("user");
  //console.log(update);
  // console.log(update.error?.errors);
  return update;
};
