const axios = require('axios');
//const  {fetch }= require('node-fetch')
const setCookie = require('set-cookie-parser');
const { HttpsProxyAgent } = require('https-proxy-agent');

const axiosClient = axios.create();

async function updateToken(cookies, key, url, data = {}, params = {}) {
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
  let httpsAgent = '';
  if (proxy !== '') {
    proxy = proxy.split(':');
    const ip = proxy[0];
    const port = proxy[1];
    const username = proxy[2];
    const password = proxy[3];
    httpsAgent = new HttpsProxyAgent('http://' + ip + ':' + port);
    axiosConfig.httpAgents = httpsAgent;
    // axiosConfig.proxy = {
    //   protocol: "https",
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
    response = await fetch(url + '?' + params, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: headers,
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
      agent: httpsAgent,
    });
    response = await response.json(); // parses JSON response into native JavaScript objects
  } catch (err) {
    // console.log(err.response?.data?.errors);
    // console.log(err);
    cookies.set('flow_errors', 'true');

    return cookies;
  }
  console.log('res');
  console.log(response);
  if (response?.status === 200) {
    const coo = setCookie.parse(response);
    console.log(coo);
    const cookieString = coo
      .map(({ name, value }) => `${name}=${value};`)
      .join(' ');
    const c = cookies.get('cookie') ? cookies.get('cookie') : '';
    cookies.set('cookie', c + cookieString);
    if (response.data.subtasks) {
      for (var task in response.data.subtasks) {
        if (task['enter_text']?.keyboard_type == 'email')
          cookies.set('confirm_email', 'true');
        if (task['subtask_id'] == 'LoginAcid') {
          if (task['enter_text']['hint_text'] == 'confirmation code')
            cookies.set('confirmation_code', 'true');
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
    cookies,
    'guest_token',
    'https://api.twitter.com/1.1/guest/activate.json'
  );
}

async function flow_start(cookies) {
  const param = new URLSearchParams();
  param.append('flow_name', 'login');
  return await updateToken(
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
async function flow_duplication_check(client) {
  return await updateToken(
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
  return await updateToken(
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

  client = await flow_password(client);
  // console.log("pass " + client);
  client = await flow_duplication_check(client);
  //console.log("dup " + client);

  //solve email challenge
  if (client.get('confirm_email') == 'true') {
    client = confirm_email(client);
    //console.log("email confirmation required");
  }

  return client;
}
exports.login = async (
  username,
  password,
  userAgent,
  proxy = '',
  email = ''
) => {
  let client = new Map();
  client.set('email', email);
  client.set('username', username);
  client.set('password', password);
  client.set('guest_token', '');
  client.set('flow_token', '');
  client.set('userAgent', userAgent);
  client.set('proxy', proxy);

  client = await execute_login_flow(client);
  if (!client || client.get('flow_errors') === 'true') {
    return { success: false, message: 'login flow failed' };
  }

  return { success: true, cookies: client };
};
