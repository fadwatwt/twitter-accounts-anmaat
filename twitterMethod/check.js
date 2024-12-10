const axios = require('axios');
const setCookie = require('set-cookie-parser');
const { HttpProxyAgent } = require('http-proxy-agent');
//const { HttpProxyAgent } = require("hpagent");
const { AccountStatus } = require('../model/AccountStatusModel');
const { requestAxios, follow, accountDataInfo } = require('./twitterMethods');
const { Worker } = require('worker_threads');
const path = require('path');
const ApiError = require('../utils/apiError');

// دالة لإزالة التكرار للـ ct0
const removeDuplicateCT0 = (cookies) => {
  const ct0Cookies = cookies.filter(cookie => cookie.name === 'ct0');
  if (ct0Cookies.length > 1) {
    // الاحتفاظ بالقيمة الأخيرة من ct0
    const latestCT0 = ct0Cookies[ct0Cookies.length - 1];

    // حذف جميع الكوكيز المكررة
    cookies = cookies.filter(cookie => cookie.name !== 'ct0');

    // إضافة الـ ct0 الصحيح
    cookies.push(latestCT0);
  }
  return cookies;
};

async function updateToken(name, cookies, key, url, data = {}, params = {}) {
  const axiosClient = axios.create();
  const guestToken = cookies?.get('guest_token') || '';
  const csrf = cookies?.get('ct0') || '';
  const authType = cookies?.get('auth_token') ? 'OAuth2Client' : '';
  const cookie = cookies?.get('cookie') || '';
  const userAgent = cookies?.get('userAgent') || '';
  let proxy = cookies?.get('proxy') || '';

  const headers = {
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
  let axiosConfig = {
    headers: headers,
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
  try {
    response = await axiosClient.post(url + '?' + params, data, axiosConfig);
    if (response?.status === 200) {
      console.log("start set cookie");
      const coo = setCookie.parse(response.headers['set-cookie']);
      console.log('Parsed Cookies:', JSON.stringify(coo, null, 2));

      // تحقق إذا كان ct0 موجودًا بالفعل في الكوكيز
      const existingCsrfToken = cookies.get('ct0');
      const newCsrfToken = coo.find((cookie) => cookie.name === 'ct0')?.value;

      // إذا كانت قيمة ct0 جديدة ولم تكن موجودة بالفعل في الكوكيز
      if (newCsrfToken && !existingCsrfToken) {
        console.log("csrfToken added => bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" + newCsrfToken);
        cookies.set('ct0', newCsrfToken);
      }
    }
  } catch (err) {
    cookies.set('flow_errors', 'true');
    let message = '';
    if (err.response && err.response.data && err.response.data.errors && err.response.data.errors[0] && err.response.data.errors[0].message) {
      message = err.response.data.errors[0].message;
    } else {
      message = name + ' Unknown error';
      cookies.set('status', AccountStatus.UnknownError);
    }
    if (name == 'username' || name == 'password') {
      cookies.set('status', AccountStatus.WrongPassword);
    } else if (name == 'phone') {
      cookies.set('status', AccountStatus.PhoneVerify);
    } else if (name == 'email') {
      cookies.set('status', AccountStatus.EmailVerify);
    }
    cookies.set('message', message);
    return cookies;
  }

  if (response?.status === 200) {
    const coo = setCookie.parse(response);

    const cookieString = coo
      .map(({ name, value }) => `${name}=${value};`)
      .join(' ');
    console.log("bbbbbb cookieString => " + cookieString);
    const c = cookies.get('cookie') ? cookies.get('cookie') : '';
    const cleanedCookie = c.replace(/ct0=[^;]+;?/g, '').trim();
    console.log("cccccccccccccccccccc cleanedCookie => " + cleanedCookie);
    console.log(c);
    cookies.set('cookie', cleanedCookie + cookieString);

    if (response.data.subtasks) {
      for (var task in response.data.subtasks) {
        if (
          response.data.subtasks[task]['enter_text']?.keyboard_type == 'email'
        )
          cookies.set('confirm_email', 'true');
        if (response.data.subtasks[task]['subtask_id'] == 'LoginAcid') {
          if (
            response.data.subtasks[task]['enter_text']['hint_text'] == 'Confirmation code'
          ) {
            cookies.set('confirmation_code', 'true');
            cookies.set('status', AccountStatus.EmailVerify);
            cookies.set('message', 'Your account need email verify');
          }
          if (
            response.data.subtasks[task]['enter_text']['hint_text'] == 'Phone number'
          ) {
            cookies.set('phoneTask', 'true');
          }
          if (
            response.data.subtasks[task]['enter_text']['hint_text']
              .toLowerCase()
              .includes('email')
          ) {
            cookies.set('confirm_email', 'true');
          }
        }
      }
    }
    cookies.set(key, response.data[key]);
    return cookies;
  }

  cookies.set('flow_errors', 'true');
  return cookies;
}


async function init_guest_token(cookies) {
  return await updateToken(
    'guest Token',
    cookies,
    'guest_token',
    'https://api.twitter.com/1.1/guest/activate.json'
  );
}

async function flow_start(cookies) {
  const param = new URLSearchParams();
  param.append('flow_name', 'login');
  return await updateToken(
    'Start flow',
    cookies,
    'flow_token',
    'https://api.twitter.com/1.1/onboarding/task.json',

    {
      input_flow_data: {
        flow_context: {
          debug_overrides: {},
          start_location: { location: 'splash_screen' },
        },
      },
      subtask_versions: {},
    },
    param
  );
}
async function flow_instrumentation(cookies) {
  //console.log("instrument toke" + cookies.get("flow_token"));
  return await updateToken(
    'flow instrumentation',
    cookies,
    'flow_token',
    'https://api.twitter.com/1.1/onboarding/task.json',
    {
      flow_token: cookies.get('flow_token'),
      subtask_inputs: [
        {
          subtask_id: 'LoginJsInstrumentationSubtask',
          js_instrumentation: { response: '{}', link: 'next_link' },
        },
      ],
    }
  );
}

async function flow_username(cookies) {
  return await updateToken(
    'username',
    cookies,
    'flow_token',
    'https://api.twitter.com/1.1/onboarding/task.json',
    {
      flow_token: cookies.get('flow_token'),
      subtask_inputs: [
        {
          subtask_id: 'LoginEnterUserIdentifierSSO',
          settings_list: {
            setting_responses: [
              {
                key: 'user_identifier',
                response_data: {
                  text_data: { result: cookies.get('username') },
                },
              },
            ],
            link: 'next_link',
          },
        },
      ],
    }
  );
}

async function flow_password(client) {
  return await updateToken(
    'password',
    client,
    'flow_token',
    'https://api.twitter.com/1.1/onboarding/task.json',
    {
      flow_token: client.get('flow_token'),
      subtask_inputs: [
        {
          subtask_id: 'LoginEnterPassword',
          enter_password: {
            password: client.get('password'),
            link: 'next_link',
          },
        },
      ],
    }
  );
}
async function flow_phone(client) {
  // console.log(client.get("phone"))
  if (client.get('phone') == '') {
    client.set('flow_errors', 'true');
    client.set(
      'message',
      'Your account need phone verify and the phone is empty.'
    );
    client.set('status', AccountStatus.PhoneVerify);

    return client;
  }
  return await updateToken(
    'phone',
    client,
    'flow_token',
    'https://api.twitter.com/1.1/onboarding/task.json',
    {
      flow_token: client.get('flow_token'),
      subtask_inputs: [
        {
          subtask_id: 'LoginAcid',
          enter_text: {
            text: client.get('phone'),
            link: 'next_link',
          },
        },
      ],
    }
  );
}
async function flow_duplication_check(client) {
  return await updateToken(
    'Login',
    client,
    'flow_token',
    'https://api.twitter.com/1.1/onboarding/task.json',
    {
      flow_token: client.get('flow_token'),
      subtask_inputs: [
        {
          subtask_id: 'AccountDuplicationCheck',
          check_logged_in_account: { link: 'AccountDuplicationCheck_false' },
        },
      ],
    }
  );
}

async function confirm_email(client) {
  if (client.get('email') == '') {
    client.set('flow_errors', 'true');
    client.set(
      'message',
      'Your account need email verify and the email is empty.'
    );
    client.set('status', AccountStatus.EmailVerify);

    return client;
  }
  return await updateToken(
    'email',
    client,
    'flow_token',
    'https://api.twitter.com/1.1/onboarding/task.json',
    {
      flow_token: client.get('flow_token'),
      subtask_inputs: [
        {
          subtask_id: 'LoginAcid',
          enter_text: {
            text: client.get('email') || '',
            link: 'next_link',
          },
        },
      ],
    }
  );
}

async function execute_login_flow(client, params) {
  console.log("execute_login_flow " + JSON.stringify(client,null,2));
  client = await init_guest_token(client);
  console.log("gest " + client);
  client = await flow_start(client);
  console.log("flostart " + client);
  client = await flow_instrumentation(client);
  console.log("flow_instrumentation " + client);
  client = await flow_username(client);
  console.log("username " + JSON.stringify(client,null,2));
  if (client.get('flow_errors') == 'true') return client;

  client = await flow_password(client);
  console.log("pass " + client);
  if (client.get('flow_errors') == 'true') return client;
  client = await flow_duplication_check(client);
  //console.log("dup " + client);
  if (client.get('flow_errors') == 'true') return client;
  //solve email challenge
  if (client.get('confirm_email') == 'true') {
    client = await confirm_email(client);
    //console.log("email confirmation required");
    if (client.get('flow_errors') == 'true') return client;
  }
  //solve email challenge
  if (client.get('phoneTask') == 'true') {
    client = await flow_phone(client);
    if (client.get('flow_errors') == 'true') return client;
    // console.log("phone");
    // console.log(client);
  }

  return client;
}
exports.login = async (
  username,
  password,
  userAgent,
  cookie,
  proxy = '',
  email = '',
  phone = ''
) => {
  let client = new Map();
  client.set('username', username);
  client.set('proxy', proxy);
  client.set('userAgent', userAgent);
  console.log("cccccccccccccccccccccccccccccccccccccccccccccccc=> " +cookie);
  try {
    if (cookie) {
      console.log("valid cookie");
      const account = {
        username: username,
        cookie:cookie,
        userAgent: userAgent,
        proxy: proxy
      };
      try {
        const result = await accountDataInfo(account);

        if (result && result.AccountDataInfo1) {
          return {
            success: true,
            cookies: {
              get: (key) => cookie, // استرجاع الكوكي كما هو
            },
            AccountDataInfo1: result.AccountDataInfo1 || {},
            Description: result.Description || '',
            AccountStatus: result.AccountStatus || 'Unknown',
          };
        }
      } catch (error) {
        console.log("Error in accountDataInfo:", error);
      }
      }
    console.log('cookie not vaild');
    client.set("cookie","")
    client.set('email', email);
    client.set('phone', phone);
    client.set('password', password);
    client.set('guest_token', '');
    client.set('flow_token', '');

    console.log("client before enter " + JSON.stringify(Object.fromEntries(client), null, 2));
    console.log("username  " + username);
    console.log("email " + email);
    console.log("password " + password);

    client = await execute_login_flow(client);
    if (
      !client ||
      client.get('flow_errors') === 'true' ||
      !client.get('cookie').includes('twid')
    ) {
      return {
        success: false,
        message: client.get('message') || 'Unknown error',
        status: client.get('status') || AccountStatus.UnknownError,
      };
    }

    return { success: true, cookies: client };

  }catch (e) {
    console.log(e);
    return { success: false };
  }
};
