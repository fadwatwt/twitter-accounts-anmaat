const express = require('express');

const {
  analyticValidator,
  tweetValidator,
  updateValidator,
  updateAccountsValidator,
  deleteTweetAccountsValidator,
  deleteTweetValidator,
  reTweetValidator,
  followValidator,
  replyValidator,
  resolveValidator,
} = require('../utils/validators/twitterValidator');

const {
  uploadmix,
  uploadtweetImages,
  uploadimportFile,
  analytics,
  updateProfile,
  uploadimageFile,
  tweet,
  updateSetOfAccounts,
  tweetSetOfAccounts,
  deleteTweett,
  deleteTweettSet,
  retweetService,
  unretweetService,
  likeService,
  unlikeService,
  followService,
  unfollowService,
  replyService,
  uploadtxtReplyFile,
  captcha,
  viewTweet,
  tweetSetOfAccountsForNotTweet,
  resizeImages,
  tweetsSetOfAccountsForPublisher,
  getTweetsNotPublish,
  getTweetsForPublisher,
} = require('../services/twitterService');

const anmaatAuth = require('../middleware/anmaatAuth');

const router = express.Router();

router
  .route('/analytics')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_analytics.view'),
    analyticValidator,
    analytics,
  );

router
  .route('/update')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.update_profile'),
    uploadimageFile,
    updateValidator,
    updateProfile,
  );

router
  .route('/tweet')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.post'),
    uploadtweetImages,
    tweetValidator,
    tweet,
  );

router
  .route('/updateAccounts')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.update_profile'),
    uploadmix,
    updateAccountsValidator,
    updateSetOfAccounts,
  );

router
  .route('/tweetAccounts')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.post'),
    uploadmix,
    updateAccountsValidator,
    tweetSetOfAccounts,
  );

// Submit-for-approval flow: caller drafts a post which a reviewer must approve.
router
  .route('/tweetAccountsPublisher')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_content.submit_for_approval'),
    uploadmix,
    resizeImages,
    updateAccountsValidator,
    tweetSetOfAccountsForNotTweet,
  );

// Reviewer publishes a previously-submitted draft.
router
  .route('/tweetsForPublisher')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_content.approve'),
    tweetsSetOfAccountsForPublisher,
  );

router
  .route('/tweetsNotPublish')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_content.list_pending'),
    getTweetsNotPublish,
  );

router
  .route('/tweetsNotPublish/:id')
  .get(
    anmaatAuth.protect,
    anmaatAuth.anyOf(
      'social_media_content.list_pending',
      'social_media_content.submit_for_approval',
    ),
    getTweetsForPublisher,
  );

router
  .route('/tweet/delete')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.delete_post'),
    deleteTweetValidator,
    deleteTweett,
  );

router
  .route('/tweetAccounts/delete')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.delete_post'),
    deleteTweetAccountsValidator,
    deleteTweettSet,
  );

router
  .route('/retweet')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.repost'),
    reTweetValidator,
    retweetService,
  );

router
  .route('/retweet/delete')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.delete_repost'),
    deleteTweetAccountsValidator,
    unretweetService,
  );

router
  .route('/like')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.like'),
    reTweetValidator,
    likeService,
  );

router
  .route('/like/delete')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.unlike'),
    reTweetValidator,
    unlikeService,
  );

router
  .route('/follow')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.follow'),
    followValidator,
    followService,
  );

router
  .route('/follow/delete')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.unfollow'),
    followValidator,
    unfollowService,
  );

router
  .route('/reply')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.reply'),
    uploadtxtReplyFile,
    replyValidator,
    replyService,
  );

router.route('/resolve').post(
  anmaatAuth.protect,
  resolveValidator,
  function (req, res, next) {
    req.setTimeout(600000);
    next();
  },
  captcha,
);

router
  .route('/tweet/view')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_actions.view'),
    replyValidator,
    viewTweet,
  );

module.exports = router;
