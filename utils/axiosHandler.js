const axios = require('axios');

const axiosClient = axios.create();

axiosClient.defaults.baseURL = 'http://localhost:8000/api/v1';
axiosClient.defaults.headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

//All request will wait 2 seconds before timeout
axiosClient.defaults.timeout = 5000;

axiosClient.defaults.withCredentials = true;

exports.getRequest = (URL, query = '') =>
  axiosClient.get(`/${URL}`).then((response) => response);

exports.postRequest = (URL, payload) =>
  axiosClient.post(`/${URL}`, payload).then((response) => response);

exports.patchRequest = (URL, payload) =>
  axiosClient.put(`/${URL}`, payload).then((response) => response);

exports.deleteRequest = (URL) =>
  axiosClient.delete(`/${URL}`).then((response) => response);
