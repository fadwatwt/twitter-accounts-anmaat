const baseURL = 'http://localhost:8000/api/v1/';

const cache = {};
const request = async (url, params = {}, method = 'GET', token = '') => {
  // const cacheKey = JSON.stringify({ url, params, method, token });
  // if (cache[cacheKey]) {
  //   return cache[cacheKey];
  // }

  const options = {
    method,
  };
  if (method === 'GET') {
    url += '?' + new URLSearchParams(params).toString();
  } else {
    options.body = JSON.stringify(params);
  }
  const header = new Headers();
  header.append('Content-Type', 'application/json');
  header.append('Accept', 'application/json');
  header.append('Access-Control-Allow-Origin', '*');
  const btoken = 'Bearer ' + token;
  header.append('Authorization', btoken);

  options.headers = header;
  options.credentials = 'same-origin';
  const result = await fetch(baseURL + url, options).then((response) => {
    if (method !== 'DELETE') return response?.json();
    else return response;
  });
  // cache[cacheKey] = result;
  //console.log(result);
  return result;
};

exports.getRequest = async (URL, params = {}, token = '', session = '') => {
  const t = await request(URL, params, 'GET', token, session);
  //console.log(t);
  return t;
};
exports.postRequest = async (URL, params, token = '') => {
  const t = await request(URL, params, 'POST', token);
  return t;
};

exports.deleteRequest = async (URL, token = '') => {
  const t = await request(URL, {}, 'DELETE', token);
  return t;
};

exports.putRequest = async (URL, params, token = '') => {
  const t = await request(URL, params, 'PUT', token);
  return t;
};
