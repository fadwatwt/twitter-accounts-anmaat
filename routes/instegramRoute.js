const express = require('express');
const { roles } = require('../model/roleModel');

const { tweetValidator } = require('../utils/validators/twitterValidator');

const {
  uploadtweetImages,
  tweet,
  uploadmix,
} = require('../services/twitterService');
const { instaPostValidator } = require('../utils/validators/instaValidator');

const authService = require('../services/authService');
const {
  check,
  unLike,
  like,
  post,
  deletePost,
  follow,
  unFollow,
  checkProxy,
  story,
  reel,
  deleteReel,
  deleteStory,
  updateAccount
} = require('../services/instaService');

const instaRoutes = express.Router();

instaRoutes.post('/check', check);
instaRoutes.post('/check-proxy', checkProxy);
instaRoutes.post('/like', like);
instaRoutes.post('/like/delete', unLike);
instaRoutes.post('/post', uploadmix, post);
instaRoutes.post('/reel', uploadmix, reel);
instaRoutes.post('/reel/delete', deleteReel);
instaRoutes.post('/story', uploadmix, story);
instaRoutes.post('/story/delete', deleteStory);
instaRoutes.post('/post/delete', deletePost);
instaRoutes.post('/follow', follow);
instaRoutes.post('/follow/delete', unFollow);
instaRoutes.put('/accounts/:id', uploadmix, updateAccount);

module.exports = instaRoutes;
