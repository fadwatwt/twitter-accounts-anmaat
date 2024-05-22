const axios = require('axios');
const setCookie = require('set-cookie-parser');
const { HttpProxyAgent } = require('http-proxy-agent');
//const { HttpProxyAgent } = require("hpagent");
const { AccountStatus } = require('../model/AccountStatusModel');
const { requestAxios, follow } = require('./twitterMethods');

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
    // const httpsAgent = new HttpProxyAgent({
    //   proxy: "http://" + username + ":" + password + "@" + ip + ":" + port,
    // });
    axiosConfig.httpAgent = httpsAgent;
    axiosConfig.proxy = false;
    // axiosConfig.proxy = {
    //   protocol: "http",
    //   host: ip,
    //   port: port,
    //   auth: {
    //     username: username,
    //     password: password,
    //   },
    // };
  }
  let response = {};
  try {
    response = await axiosClient.post(url + '?' + params, data, axiosConfig);
  } catch (err) {
    // console.log(err.response?.data?.errors);
    // console.log(err.response);
    cookies.set('flow_errors', 'true');
    let message = '';
    if (err.response?.data?.errors[0].message) {
      message = err.response?.data?.errors[0].message;
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
  //console.log(key);

  //console.log(JSON.stringify(response.data));
  if (response?.status === 200) {
    const coo = setCookie.parse(response);

    const cookieString = coo
      .map(({ name, value }) => `${name}=${value};`)
      .join(' ');
    const c = cookies.get('cookie') ? cookies.get('cookie') : '';
    console.log(c);
    cookies.set('cookie', c + cookieString);
    //  console.log(JSON.stringify(response.data));
    // console.log("********************************");

    if (response.data.subtasks) {
      for (var task in response.data.subtasks) {
        // console.log(task);
        if (
          response.data.subtasks[task]['enter_text']?.keyboard_type == 'email'
        )
          cookies.set('confirm_email', 'true');
        if (response.data.subtasks[task]['subtask_id'] == 'LoginAcid') {
          // console.log("loginAcid");

          if (
            response.data.subtasks[task]['enter_text']['hint_text'] ==
            'Confirmation code'
          ) {
            cookies.set('confirmation_code', 'true');
            cookies.set('status', AccountStatus.EmailVerify);
            cookies.set('message', 'Your account need email verify');
          }
          if (
            response.data.subtasks[task]['enter_text']['hint_text'] ==
            'Phone number'
          ) {
            //console.log("loginAcid");

            cookies.set('phoneTask', 'true');
          }
          if (
            response.data.subtasks[task]['enter_text']['hint_text']
              .toLowerCase()
              .includes('email')
          ) {
            //console.log("loginAcid");

            cookies.set('confirm_email', 'true');
          }
        }
      }
    }
    cookies.set(key, response.data[key]);
    // console.log(cookies)
    return cookies;
  }
  //console.log(response)
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
  client = await init_guest_token(client);
  //console.log("gest " + client);
  client = await flow_start(client);
  //console.log("flostart " + client);

  client = await flow_instrumentation(client);
  // console.log("flow_instrumentation " + client);

  client = await flow_username(client);
  // console.log("username " + client);
  if (client.get('flow_errors') == 'true') return client;

  client = await flow_password(client);
  // console.log("pass " + client);
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
  client.set('cookie', cookie);
  if (cookie) {
    console.log('pleaaaaaaaaaaaaaaaaaaaase');
    const url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    const account = { username, Proxy: proxy, userAgent, cookie };
    console.log(account);

    const result = await requestAxios(account, 'data', url);
    console.log(result);
    if (!result.error) {
      console.log('cookie vaild');
      return {
        success: true,
        cookies: client,
        location: result.location,
        followers: result.followers_count,
        following: result.friends_count,
        description: result.description,
        result,
      };
    }
  }
  console.log('cookie not vaild');

  client.set('email', email);
  client.set('phone', phone);
  client.set('password', password);
  client.set('guest_token', '');
  client.set('flow_token', '');

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
};
