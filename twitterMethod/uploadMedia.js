const axios = require('axios');
const setCookie = require('set-cookie-parser');
const { HttpProxyAgent } = require('http-proxy-agent');
const { request } = require('express');

const MAX_IMAGE_SIZE = 5242880; // ~5 MB
const MAX_GIF_SIZE = 15728640; // ~15 MB
const MAX_VIDEO_SIZE = 536870912; // ~530 MB

async function requestAxios(
  account,
  url,
  method = 'get',
  // params = {},
  data = '',
  isMultipart = false
) {
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
    // domain: "upload.twitter.com",
    Referer: 'https://twitter.com/',
    //"x-twitter-client-language": "en",
    Authorization:
      'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-twitter-active-user': 'yes',
    'x-csrf-token': csrf,
    'x-twitter-auth-type': authType,
    'User-Agent': userAgent,
    'x-guest-token': guestToken,
    // Accept:
    //  "image/gif, image/jpeg, image/pjpeg, image/pjpeg, application/msword, application/xaml+xml, application/x-ms-xbap, application/x-ms-application, application/vnd.ms-xpsdocument,text/html, application/xhtml+xml, application/xml, application/json, text/javascript, */*",
    Cookie: cookie,
  };
  if (isMultipart) {
    headers['Content-Type'] = 'multipart/form-data';
    //headers["Content-Transfer-Encoding"] = "base64";
  }
  let axiosConfig = {
    url,
    headers: headers,
    // params: params,
    method: method,
    data: data,
  };
  if (proxy !== '') {
    proxy = proxy.split(':');
    const ip = proxy[0];
    const port = proxy[1];
    const username = proxy[2];
    const password = proxy[3];
    const httpsAgent = new HttpProxyAgent(
      'http://' + username + ':' + password + '@' + ip + ':' + port
    );

    axiosConfig.httpAgent = httpsAgent;
    axiosConfig.proxy = false;
  }
  let response = {};
  //console.log(headers);
  try {
    response = await axios(axiosConfig);
    // console.log(response)
  } catch (err) {
    //console.log("catch");

    //console.log(err.response?.data?.errors);
    //console.log(err.response.data);
    result.error = err.response?.data || err.message;

    return result;
  }
  //console.log(response?.status);

  if (response?.status === 200 || response?.status === 202) {
    result = response.data;
    //console.log(result);
    return result;
  }

  return result;
}

async function checkMedia(category, size) {
  const fx = (x) => (x / (1024 * 1024)).toFixed(2);
  if (category.includes('image') && size > MAX_IMAGE_SIZE)
    return {
      error: true,
      message: `cannot upload ${fx(size)} MB ${category}, max size is ${fx(
        MAX_IMAGE_SIZE
      )}`,
    };
  if (category.includes('gif') && size > MAX_GIF_SIZE)
    return {
      error: true,
      message: `cannot upload ${fx(size)} MB ${category}, max size is ${fx(
        MAX_GIF_SIZE
      )}`,
    };
  if (category.includes('video') && size > MAX_VIDEO_SIZE)
    return {
      error: true,
      message: `cannot upload ${fx(size)} MB ${category}, max size is ${fx(
        MAX_VIDEO_SIZE
      )}`,
    };
  return true;
}

const url = 'https://upload.twitter.com/i/media/upload.json';

exports.uploadMedia = async (account, file, isDm = false) => {
  // console.log(file);
  let size = file.size;
  let base64EncodedFile = file.buffer.toString('base64');

  //base64EncodedFile = "data:" + "image/webp" + ";base64," + base64EncodedFile;
  //size = base64EncodedFile.length;

  const uploadType = isDm ? 'dm' : 'tweet';
  let mediaType = '';
  let mediaCategory = '';
  if (file.originalname.toLowerCase().endsWith('.gif')) {
    mediaType = 'image%2Fgif';
    mediaCategory = isDm ? 'dm_gif' : 'tweet_gif';
  } else if (file.originalname.toLowerCase().endsWith('.mp4')) {
    mediaType = 'video%2Fmp4';
    mediaCategory = isDm ? 'dm_video' : 'tweet_video';
  } else {
    mediaType = 'image%2Fwebp';
    mediaCategory = isDm ? 'dm_image' : 'tweet_image';
  }
  const check = await checkMedia(mediaCategory, size);
  if (check.error) {
    check.account = account.username;
    return check;
  }

  let param = new URLSearchParams();
  param.append('command', 'INIT');
  param.append('media_type', mediaType);
  param.append('total_bytes', size);
  param.append('media_category', mediaCategory);

  const initMedia = await requestAxios(account, url + '?' + param, 'post');
  // console.log("initMedia");
  //console.log(initMedia);
  if (initMedia.error || !initMedia.media_id_string) {
    initMedia.account = account.username;
    return initMedia;
  }

  //console.log(base64EncodedFile)
  //console.log(size+" bytes")
  const media_id_string = initMedia.media_id_string;
  const splitStringRe = new RegExp('.{1,' + 1000000 + '}', 'g');
  const chunks = base64EncodedFile.match(splitStringRe);

  for (const [segment_index, media_data] of chunks.entries()) {
    //  console.log(segment_index);
    // console.log(media_data);
    param = new URLSearchParams();
    param.append('command', 'APPEND');
    param.append('segment_index', segment_index);
    // param.append("media_data", media_data);
    param.append('media_id', media_id_string);
    const data = {
      media_data: media_data,
      media_id: media_id_string,
      segment_index: segment_index,
      command: 'APPEND',
    };
    const re = await requestAxios(account, url, 'post', data, true);
    // console.log("appand");
    // console.log(re);
    if (re.error) {
      re.account = account.username;
      return re;
    }
  }

  param = new URLSearchParams();
  param.append('command', 'FINALIZE');
  param.append('media_id', media_id_string);
  // param.append("allow_async", true);

  const finalize = await requestAxios(account, url + '?' + param, 'post');
  //console.log("finalize");
  //console.log(finalize);
  let processInfo = finalize.processing_info;
  while (processInfo) {
    param = new URLSearchParams();
    param.append('command', 'STATUS');
    param.append('media_id', media_id_string);

    const state = processInfo['state'];
    if (processInfo.error) return processInfo.error;
    if (state === 'succeeded') break;
    if (state === 'failed') return;
    const status = await requestAxios(account, url + '?' + param, 'get');
    //console.log("status");
    // console.log(status);
    processInfo = status.processing_info;
  }
  //console.log(media_id_string)
  return media_id_string;
};
