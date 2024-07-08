const axios = require('axios');
const puppeteer = require('puppeteer');
const setCookie = require('set-cookie-parser');
const { HttpProxyAgent } = require('http-proxy-agent');
const url = require('url');
const querystring = require('querystring');
//const { HttpProxyAgent } = require("hpagent");
const { uploadMedia, uploadMediaForPublisher } = require('./uploadMedia');

const { AccountStatus } = require('../model/AccountStatusModel');
const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

function extractUsernameFromTwitterUrl(twitterUrl) {
  // Parse the URL
  const parsedUrl = url.parse(twitterUrl);

  // Extract the path from the URL
  const path = parsedUrl.pathname;

  // Remove leading slash if present
  const cleanedPath = path.replace(/^\/+/, '');

  // Split the path into segments
  const pathSegments = cleanedPath.split('/');

  // The Twitter username is the first segment after the domain
  const username = cleanedPath;

  // If there are query parameters, check for 's' parameter and extract username
  if (parsedUrl.query) {
    const queryParams = querystring.parse(parsedUrl.query);
    console.log(queryParams.s);
    if (queryParams.s && !username) {
      return queryParams.s;
    }
  }
  return username;
}

exports.requestAxios = async (
  account,
  key,
  url,
  method = 'get',
  data = {},
  isurlencoded = false
) => {
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
    Referer: url,
    'Content-Type': 'application/json',
    Authorization:
      'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
    'x-guest-token': guestToken,
    'x-csrf-token': csrf,
    'x-twitter-auth-type': authType,
    'User-Agent': userAgent,
    Cookie: cookie,
  };
  if (isurlencoded) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    // headers["Livepipeline-Session"] = "7f8df689-2c5c-4c0e-83a3-bd9b72a8b4c9";
  }
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
    const httpsAgent = new HttpProxyAgent(
      'http://' + username + ':' + password + '@' + ip + ':' + port
    );

    axiosConfig.httpAgent = httpsAgent;
    axiosConfig.proxy = false;
  }
  let response = {};
  //console.log(axiosConfig);
  try {
    response = await axios(axiosConfig);
    console.log('response');
    console.log(response);
    console.log('response');
  } catch (err) {
    //console.log("catch");

    //console.log(err.response?.data?.errors);
    // console.log(err);
    result.error = err.response?.data || err.message;

    return result;
  }
  //console.log(response)
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
};

const requestAxios = async (
  account,
  key,
  url,
  method = 'get',
  data = {},
  isurlencoded = false
) => {
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
    Referer: url,
    'Content-Type': 'application/json',
    Authorization:
      'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
    'x-guest-token': guestToken,
    'x-csrf-token': csrf,
    'x-twitter-auth-type': authType,
    'User-Agent': userAgent,
    Cookie: cookie,
  };
  if (isurlencoded) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    // headers["Livepipeline-Session"] = "7f8df689-2c5c-4c0e-83a3-bd9b72a8b4c9";
  }
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
    const httpsAgent = new HttpProxyAgent(
      'http://' + username + ':' + password + '@' + ip + ':' + port
    );

    axiosConfig.httpAgent = httpsAgent;
    axiosConfig.proxy = false;
  }
  let response = {};
  //console.log(axiosConfig);
  try {
    response = await axios(axiosConfig);
  } catch (err) {
    //console.log("catch");

    //console.log(err.response?.data?.errors);
    // console.log(err);
    result.error = err.response?.data || err.message;

    return result;
  }
  //console.log(response)
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
};

async function requestAxiosNormal(
  account,
  key,
  url,
  method = 'get',
  data = {},
  isurlencoded = false
) {
  //console.log(account);

  let result = {};
  const cookie = account.cookie || '';

  const splitCookieHeaders = setCookie.splitCookiesString(cookie);
  const cookies = setCookie.parse(splitCookieHeaders);
  //console.log(cookies);
  // const guestToken = cookies[0]["guest_id"] || "";
  //const csrf = cookies[0]["ct0"] || "";
  //const authType = cookies[0]["auth_token"] ? "OAuth2Session" : "";
  const userAgent = account.userAgent || '';
  let proxy = account.Proxy || '';

  const headers = {
    // Referer: url,
    // "Content-Type": "application/json",
    // Authorization:
    //  "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
    //"x-twitter-active-user": "yes",
    // "x-twitter-client-language": "en",
    //"x-guest-token": guestToken,
    //"x-csrf-token": csrf,
    //"x-twitter-auth-type": authType,
    'User-Agent': userAgent,
    Cookie: cookie,
  };
  if (isurlencoded) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    // headers["Livepipeline-Session"] = "7f8df689-2c5c-4c0e-83a3-bd9b72a8b4c9";
  }
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
    const httpsAgent = new HttpProxyAgent(
      'http://' + username + ':' + password + '@' + ip + ':' + port
    );

    axiosConfig.httpAgent = httpsAgent;
    axiosConfig.proxy = false;
  }
  let response = {};
  //console.log(axiosConfig);
  try {
    response = await axios(axiosConfig);
  } catch (err) {
    //console.log("catch");

    //console.log(err.response?.data?.errors);
    // console.log(err);
    result.error = err.response?.data || err.message;

    return result;
  }
  //console.log(response)
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
exports.getTimline = async (account) => {
  const result = await requestAxios(
    account,
    'timeline',
    'https://twitter.com/i/api/graphql/4S2ihIKfF3xhp-ENxvUAfQ/UserByScreenName?variables=%7B%22screen_name%22%3A%22' +
      account.username +
      '%22%2C%22withHighlightedLabel%22%3Atrue%7D'
  );
  if (result.data) return result.data.data.user;
  else return result;
};

exports.accountDataInfo = async (account) => {
  //const url =
  //"https://twitter.com/i/api/graphql/HCosKfLNW1AcOo3la3mMgg/HomeTimeline?variables=%7B%22screen_name%22%3A%22" +
  //  account.username +
  //"%22%2C%22withHighlightedLabel%22%3Atrue%2C%22includePromotedContent%22%3A%20true%2C%22withV2Timeline%22%3A%20true%7D&&features=%7B%22blue_business_profile_image_shape_enabled%22%3A%20true%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3A%20true%2C%20%22freedom_of_speech_not_reach_fetch_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22graphql_timeline_v2_bookmark_timeline%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22hidden_profile_likes_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22highlights_tweets_tab_ui_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22interactive_text_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22longform_notetweets_consumption_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22longform_notetweets_inline_media_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22longform_notetweets_rich_text_read_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22longform_notetweets_richtext_consumption_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22profile_foundations_tweet_stats_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22profile_foundations_tweet_stats_tweet_frequency%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_birdwatch_note_limit_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_edit_tweet_api_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_enhance_cards_enabled%22%3A%20false%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_graphql_exclude_directive_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3A%20false%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_graphql_timeline_navigation_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_media_download_video_enabled%22%3A%20false%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_text_conversations_enabled%22%3A%20false%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_twitter_article_data_v2_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_twitter_article_tweet_consumption_enabled%22%3A%20false%2C%0A%20%20%20%20%20%20%20%20%22responsive_web_twitter_blue_verified_badge_is_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22rweb_lists_timeline_redesign_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22spaces_2022_h2_clipping%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22spaces_2022_h2_spaces_communities%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22standardized_nudges_misinfo%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22subscriptions_verification_info_verified_since_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22tweet_awards_web_tipping_enabled%22%3A%20false%2C%0A%20%20%20%20%20%20%20%20%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22tweetypie_unmention_optimization_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22verified_phone_label_enabled%22%3A%20false%2C%0A%20%20%20%20%20%20%20%20%22vibe_api_enabled%22%3A%20true%2C%0A%20%20%20%20%20%20%20%20%22view_counts_everywhere_api_enabled%22%3A%20true%0A%20%20%20%20%7D";
  const url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
  const result = await requestAxios(account, 'data', url);
  // if (result.data) return result.data;
  // console.log(result);

  if (!result.error) {
    const Accountt = {};

    Accountt.AccountDataInfo1 = {
      FullName: result.name,
      Following: result.friends_count,
      Followers: result.followers_count,
      Tweets: result.statuses_count,
      Favorites: result.favourites_count,
      AccountLocation: result.location,
      image: result.profile_image_url_https,
    };
    Accountt.AccountStatus = AccountStatus.Normal;
    // console.log(Accountt);
    if (result.suspended == true)
      Accountt.AccountStatus = AccountStatus.Suspended;
    if (result.needs_phone_verification == true)
      Accountt.AccountStatus = AccountStatus.PhoneVerify;
    if (result.advertiser_account_service_levels?.includes('analytics'))
      Accountt.analytics = true;
    // else Accountt.analytics = false;
    //console.log(Accountt);

    const islocked = await checklocked(account);
    if (islocked.locked) {
      Accountt.AccountStatus = islocked.status;
    }
    console.log(Accountt);
    return Accountt;
  }
  return result;
};
exports.tweetText = async (account, tweet) => {
  const params = new URLSearchParams({
    status: tweet,
    include_profile_interstitial_type: 1,
    include_blocking: 1,
    include_blocked_by: 1,
    include_followed_by: 1,
    include_want_retweets: 1,
    include_mute_edge: 1,
    include_can_dm: 1,
    include_can_media_tag: 1,
    skip_status: 1,
    cards_platform: 'Web-12',
    include_cards: 1,
    include_ext_alt_text: true,
    include_quote_count: true,
    include_reply_count: 1,
    tweet_mode: 'extended',
    simple_quoted_tweet: true,
    trim_user: false,
    include_ext_media_color: true,
    include_ext_media_availability: true,
    auto_populate_reply_metadata: false,
    batch_mode: 'off',
  });
  const url = 'https://api.twitter.com/1.1/statuses/update.json';
  const status = await requestAxios(account, 'status', url, 'post', params);
  // console.log(JSON.stringify(status));
  return status;
};
exports.tweetText1 = async (account, tweet, media = null, schedule = null) => {
  // console.log(account)
  //console.log(tweet)
  //console.log(media)
  let variables = {
    tweet_text: tweet,
    dark_request: false,
    media: {
      media_entities: [],
      possibly_sensitive: false,
    },
    semantic_annotation_ids: [],
  };
  let features = {
    blue_business_profile_image_shape_enabled: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    freedom_of_speech_not_reach_fetch_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    graphql_timeline_v2_bookmark_timeline: true,
    hidden_profile_likes_enabled: true,
    highlights_tweets_tab_ui_enabled: true,
    interactive_text_enabled: true,
    longform_notetweets_consumption_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_richtext_consumption_enabled: true,
    profile_foundations_tweet_stats_enabled: true,
    profile_foundations_tweet_stats_tweet_frequency: true,
    responsive_web_birdwatch_note_limit_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    responsive_web_enhance_cards_enabled: false,
    responsive_web_graphql_exclude_directive_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_media_download_video_enabled: false,
    responsive_web_text_conversations_enabled: false,
    responsive_web_twitter_article_data_v2_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    responsive_web_twitter_blue_verified_badge_is_enabled: true,
    rweb_lists_timeline_redesign_enabled: true,
    spaces_2022_h2_clipping: true,
    spaces_2022_h2_spaces_communities: true,
    standardized_nudges_misinfo: true,
    subscriptions_verification_info_verified_since_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    tweetypie_unmention_optimization_enabled: true,
    verified_phone_label_enabled: false,
    vibe_api_enabled: true,
    view_counts_everywhere_api_enabled: true,
  };
  console.log('TESTinggg after features');
  let params = {};
  ///check schedule
  if (schedule != null) {
    variables = {
      post_tweet_request: {
        auto_populate_reply_metadata: false,
        status: tweet,
        exclude_reply_user_ids: [],
        media_ids: [],
      },
      execute_at: Math.floor(Date.parse(schedule) / 1000),
    };
  }

  ///////////////////
  if (media[0] != undefined || media[0] != null) {
    console.log('media');
    console.log(media);
    console.log(typeof media);

    console.log('media');
    for (let i = 0; i < media.length; i++) {
      const media_id = await uploadMedia(account, media[i]);
      console.log('after requesting and return', media_id);
      if (!media_id.error) {
        if (schedule == null) {
          variables['media']['media_entities'].push({
            media_id: media_id,
            tagged_users: [],
          });
        } else {
          variables['post_tweet_request']['media_ids'].push(media_id);
        }
      } else if (media_id.error) {
        return media_id;
      }
    }
  }
  console.log('TESTinggg before params');

  params = {
    queryId: '7TKRKCPuAGsmYde0CudbVg',
    features: features,
    variables: variables,
  };
  let url =
    'https://twitter.com/i/api/graphql/7TKRKCPuAGsmYde0CudbVg/CreateTweet';
  if (schedule != null) {
    params.queryId = 'LCVzRQGxOaGnOnYH01NQXg';
    url =
      'https://twitter.com/i/api/graphql/LCVzRQGxOaGnOnYH01NQXg/CreateScheduledTweet';
  }
  console.log('before requesting requestAxios ');
  const status = await requestAxios(account, 'status', url, 'post', params);
  // console.log(JSON.stringify(status));
  return status;
};
////get the last n tweet ID
exports.getLastTweets = async (account, count, retweet = false) => {
  let url = 'https://twitter.com/i/api/1.1/statuses/user_timeline.json';
  let params = {
    screen_name: account.username,
    count: 200,
    exclude_replies: true,
    include_rts: retweet,
    trim_user: true,
  };
  // console.log(params);
  params = new URLSearchParams(params);
  let tweets = await requestAxios(account, '', url + '?' + params, 'get');
  //console.log(tweets);

  if (tweets == '') {
    url = 'https://twitter.com/i/api/1.1//statuses/user_timeline.json';

    tweets = await requestAxios(account, '', url + '?' + params, 'get');
  }
  //console.log(JSON.stringify(tweets));
  const ids = [];
  if (!tweets.error && tweets.length > 0) {
    for (let i = 0; i < tweets.length; i++) {
      if (ids.length == count) {
        break;
      }
      if (retweet && tweets[i].retweeted_status) {
        //console.log(tweets[i].retweeted_status);
        ids.push(tweets[i].retweeted_status.id_str);
      }
      if (!retweet) {
        ids.push(tweets[i].id_str);
      }
    }
    console.log(ids);
    return ids;
  }
  return tweets;
};
////delete tweets
exports.deleteTweet = async (account, tweetId) => {
  let variables = { tweet_id: tweetId, dark_request: false };
  let params = {
    queryId: 'VaenaVgh5q5ih7kvyVjgtg',
    variables: variables,
  };
  let url =
    'https://twitter.com/i/api/graphql/VaenaVgh5q5ih7kvyVjgtg/DeleteTweet';

  const status = await requestAxios(account, 'status', url, 'post', params);
  //console.log(status);
  return status;
};
exports.reTweet = async (account, tweetId) => {
  console.log(account);
  const variables = { tweet_id: tweetId, dark_request: false };
  const params = {
    queryId: 'ojPdsZsimiJrUGLR1sjUtA',
    variables: variables,
  };
  const url =
    'https://twitter.com/i/api/graphql/ojPdsZsimiJrUGLR1sjUtA/CreateRetweet';

  const status = await requestAxios(account, 'status', url, 'post', params);
  //console.log(JSON.stringify(status));
  return status;
};
exports.unReTweet = async (account, tweetId) => {
  let variables = { source_tweet_id: tweetId, dark_request: false };
  let params = {
    queryId: 'iQtK4dl5hBmXewYZuEOKVw',
    variables: variables,
  };
  let url =
    'https://twitter.com/i/api/graphql/iQtK4dl5hBmXewYZuEOKVw/DeleteRetweet';

  const status = await requestAxios(account, 'status', url, 'post', params);
  // console.log(JSON.stringify(status));
  return status;
};
exports.like = async (account, tweetId) => {
  try {
    let variables = { tweet_id: tweetId, dark_request: false };
    let params = {
      queryId: 'lI07N6Otwv1PhnEgXILM7A',
      variables: variables,
    };
    let url =
      'https://twitter.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet';

    const status = await requestAxios(account, 'status', url, 'post', params);
    console.log(JSON.stringify(status));
    if (status.errors || status.error) {
      if (status.errors[0].message.includes('already favorited')) {
        throw new Error('already favorited');
      } else if (status.errors[0].message.includes('not found')) {
        throw new Error('not found');
      }
    }
    return status;
  } catch (err) {
    throw err;
  }
};

exports.unlike = async (account, tweetId) => {
  let variables = { tweet_id: tweetId, dark_request: false };
  let params = {
    queryId: 'ZYKSe-w7KEslx3JhSIk5LA',
    variables: variables,
  };
  let url =
    'https://twitter.com/i/api/graphql/ZYKSe-w7KEslx3JhSIk5LA/UnfavoriteTweet';

  const status = await requestAxios(account, 'status', url, 'post', params);
  if (status.errors || status.error) {
    if (status.errors[0].message.includes("was not found in actor's")) {
      throw new Error('already not favorited');
    } else if (status.errors[0].message.includes('_Missing: Tweet record')) {
      throw new Error('not found');
    }
  }
  //console.log(JSON.stringify(status));
  return status;
};
exports.follow = async (account, followname) => {
  // const status = await getAccountInfo(account, followname);
  // if (status.errors || status.error) {
  //   return status;
  // }
  // const id = status.data?.user?.rest_id || "";

  try {
    followname = extractUsernameFromTwitterUrl(followname);

    const follow_settings = {
      include_profile_interstitial_type: '1',
      include_blocking: '1',
      include_blocked_by: '1',
      include_followed_by: '1',
      include_want_retweets: '1',
      include_mute_edge: '1',
      include_can_dm: '1',
      include_can_media_tag: '1',
      include_ext_has_nft_avatar: '1',
      include_ext_is_blue_verified: '1',
      include_ext_verified_type: '1',
      skip_status: '1',
      //user_id: id,
      screen_name: followname,
    };
    let url = 'https://api.twitter.com/1.1/friendships/create.json';
    let param = new URLSearchParams(follow_settings);

    const follo = await requestAxios(
      account,
      'status',
      url,
      'post',
      param,
      true
    );
    //handle error
    if (follo.error && follo.error.errors) {
      if (
        follo.error.errors[0].message.includes('Cannot find specified user')
      ) {
        throw new Error('not found');
      } else {
        // console.log(follo.error.errors[0].message);
        throw new Error(follo.error.errors[0].message);
      }
    }
    return follo;
  } catch (err) {
    // console.log("got caught",err);
    throw err;
  }
};
let getAccountInfo = async (account, username) => {
  const url =
    'https://twitter.com/i/api/graphql/esn6mjj-y68fNAj45x5IYA/UserByScreenName?variables=%7B%22screen_name%22%3A%22' +
    username +
    '%22%2C%22withHighlightedLabel%22%3Atrue%7D';
  const result = await requestAxios(account, '', url, 'get');
  //console.log(JSON.stringify(result))
  return result;
};

exports.unfollow = async (account, followname) => {
  // const status = await getAccountInfo(account, followname);
  // console.log(status)
  // if (status.errors || status.error) {
  //   return status;
  // }
  //const id = status.data?.user?.rest_id || "";
  try {
    followname = extractUsernameFromTwitterUrl(followname);
    const follow_settings = {
      include_profile_interstitial_type: '1',
      include_blocking: '1',
      include_blocked_by: '1',
      include_followed_by: '1',
      include_want_retweets: '1',
      include_mute_edge: '1',
      include_can_dm: '1',
      include_can_media_tag: '1',
      include_ext_has_nft_avatar: '1',
      include_ext_is_blue_verified: '1',
      include_ext_verified_type: '1',
      skip_status: '1',
      screen_name: followname,
    };
    let url = 'https://api.twitter.com/1.1/friendships/destroy.json';
    let param = new URLSearchParams(follow_settings);

    const follo = await requestAxios(
      account,
      'status',
      url,
      'post',
      param,
      true
    );
    //console.log(JSON.stringify(follo));
    if (follo.error && follo.error.errors) {
      if (
        follo.error.errors[0].message.includes('Cannot find specified user')
      ) {
        throw new Error('not found');
      } else {
        // console.log(follo.error.errors[0].message);
        throw new Error(follo.error.errors[0].message);
      }
    }
    return follo;
  } catch (err) {
    throw err;
  }
};

exports.reply = async (account, reply, tweetURl) => {
  const text = reply.trim();
  const tweet = tweetURl
    .substring(tweetURl.indexOf('/status/') + '/status/'.length)
    .replace('?p=v', '');

  let variables = {
    tweet_text: text,
    reply: {
      in_reply_to_tweet_id: tweet,
      exclude_reply_user_ids: [],
    },
    batch_compose: 'BatchSubsequent',
    dark_request: false,
    media: {
      media_entities: [],
      possibly_sensitive: false,
    },
    semantic_annotation_ids: [],
  };
  let features = {
    blue_business_profile_image_shape_enabled: true,
    creator_subscriptions_tweet_preview_api_enabled: true,
    freedom_of_speech_not_reach_fetch_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    graphql_timeline_v2_bookmark_timeline: true,
    hidden_profile_likes_enabled: true,
    highlights_tweets_tab_ui_enabled: true,
    interactive_text_enabled: true,
    longform_notetweets_consumption_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_richtext_consumption_enabled: true,
    profile_foundations_tweet_stats_enabled: true,
    profile_foundations_tweet_stats_tweet_frequency: true,
    responsive_web_birdwatch_note_limit_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    responsive_web_enhance_cards_enabled: false,
    responsive_web_graphql_exclude_directive_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_media_download_video_enabled: false,
    responsive_web_text_conversations_enabled: false,
    responsive_web_twitter_article_data_v2_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: false,
    responsive_web_twitter_blue_verified_badge_is_enabled: true,
    rweb_lists_timeline_redesign_enabled: true,
    spaces_2022_h2_clipping: true,
    spaces_2022_h2_spaces_communities: true,
    standardized_nudges_misinfo: true,
    subscriptions_verification_info_verified_since_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    tweetypie_unmention_optimization_enabled: true,
    verified_phone_label_enabled: false,
    vibe_api_enabled: true,
    view_counts_everywhere_api_enabled: true,
  };
  let params = {};

  params = {
    queryId: '7TKRKCPuAGsmYde0CudbVg',
    features: features,
    variables: variables,
  };
  let url =
    'https://twitter.com/i/api/graphql/7TKRKCPuAGsmYde0CudbVg/CreateTweet';
  const status = await requestAxios(account, 'status', url, 'post', params);
  // console.log("reply");

  //console.log(JSON.stringify(status));
  return status;
};
exports.resolveCaptcha = async (account) => {
  const url =
    'https://iframe.arkoselabs.com/0152B4EB-D2DC-460A-89A1-629838B529C9/index.html?mkt=en';

  const result = await requestAxios(account, '', url, 'get', {}, true);
  console.log(result);
  return result;
};
exports.TweetView = async (account, tweet) => {
  const param = { sub_topics: '/tweet_engagement/' + tweet, unsub_topics: '' };
  const params = new URLSearchParams(param);
  const p =
    'variables=%7B%22focalTweetId%22%3A%22' +
    tweet +
    '%22%2C%22with_rux_injections%22%3Afalse%2C%22includePromotedContent%22%3Atrue%2C%22withCommunity%22%3Afalse%2C%22withQuickPromoteEligibilityTweetFields%22%3Atrue%2C%22withBirdwatchNotes%22%3Afalse%2C%22withVoice%22%3Afalse%2C%22withV2Timeline%22%3Afalse%7D&features=%7B%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22tweetypie_unmention_optimization_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Afalse%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_media_download_video_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D&fieldToggles=%7B%22withArticleRichContentState%22%3Afalse%7D';
  let url =
    'https://twitter.com/i/api/graphql/xOhkmRac04YFZmOzU9PJHg/TweetDetail?' + p;
  // let url="https://api.twitter.com/1.1/live_pipeline/update_subscriptions"
  const result = await requestAxios(account, 'data', url, 'post', p, true);
  console.log(
    result.data.threaded_conversation_with_injections.instructions[0].entries[0]
      .content.itemContent.tweet_results.result.views.count
  );
  //console.log(JSON.stringify(result))
  return result;
};

exports.ShowTweet = async (account, tweet) => {
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

  try {
    await page.goto(tweet, {
      waitUntil: 'networkidle2',
    });
  } catch (e) {}
  await new Promise((resolve) => setTimeout(resolve, 12000));

  await browser.close();
};
let checklocked = async (account) => {
  const result = await requestAxiosNormal(
    account,
    '',
    'https://twitter.com/account/access?lang=en',
    'get'
  );
  if (result.includes('Password change required')) {
    return { locked: true, status: AccountStatus.PasswordChangeRequired };
  } else if (result.includes('arkose_form')) {
    return { locked: true, status: AccountStatus.Locked };
  } else {
    return { locked: false };
  }

  // let browser;
  // let username;
  // let password;
  // if (account.Proxy !== "") {
  //   const proxy = account.Proxy.split(":");
  //   const ip = proxy[0];
  //   const port = proxy[1];
  //   username = proxy[2];
  //   password = proxy[3];
  //   browser = await puppeteer.launch({
  //     headless: true,
  //     args: [
  //       "--proxy-server=" + ip + ":" + port,
  //       "--proxy-auth=" + username + ":" + password,
  //       "--no-sandbox",
  //       "--disable-setuid-sandbox",
  //     ],
  //   });
  // } else {
  //   browser = await puppeteer.launch({
  //     headless: true,
  //     args: ["--no-sandbox", "--disable-setuid-sandbox"],
  //   });
  // }
  // const page = await browser.newPage();
  // if (account.proxy !== "") {
  //   await page.authenticate({ username: username, password: password });
  // }
  // await page.setUserAgent(account.userAgent);
  // let splittedPairs = account.cookie.split(";");

  // let cookies = setCookie.parse(splittedPairs);
  // cookies = cookies.map(async (cook) => {
  //   const ob = { name: cook.name.trim(), value: cook.value.trim() };
  //   ob.domain = ".twitter.com";
  //   await page.setCookie(ob);

  //   return ob;
  // });
  // /// console.log(cookies);

  // await page.goto("https://twitter.com/account/access?lang=en", {
  //   waitUntil: "networkidle2",
  // });
  // //await new Promise((resolve) => setTimeout(resolve, 6000));

  // await new Promise((resolve) => setTimeout(resolve, 12000));

  // if (page.url().includes("https://twitter.com/home")) {
  //   // console.log("here already");
  //   await browser.close();

  //   return { locked: false };
  // } else {
  //   const content = await page.content();
  //   //  console.log(content);
  //   if (content.includes("Password change required")) {
  //     await browser.close();

  //     return { locked: true, status: AccountStatus.PasswordChangeRequired };
  //   }
  //   await browser.close();

  //   return { locked: true, status: AccountStatus.Locked };
  // }

};
