const express = require('express');
const { roles } = require('../model/roleModel');

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
  viewTweet, tweetSetOfAccountsForNotTweet, resizeImages, tweetsSetOfAccountsForPublisher, getTweetsNotPublish,
  getTweetsForPublisher,
} = require('../services/twitterService');

const authService = require('../services/authService');
const { follow, TweetView } = require('../twitterMethod/twitterMethods');

const router = express.Router();

router
  .route('/analytics')
  .get(authService.protect, analyticValidator, analytics);

router
  .route('/update')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.publisher,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    uploadimageFile,
    updateValidator,
    updateProfile
  );
router
  .route('/tweet')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.publisher,
      roles.publisherWriter,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    uploadtweetImages,
    tweetValidator,
    tweet
  );

router
  .route('/updateAccounts')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.publisher,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    uploadmix,
    updateAccountsValidator,
    updateSetOfAccounts
  );
router
  .route('/tweetAccounts')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.publisher,
      roles.publisherWriter,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    uploadmix,
    updateAccountsValidator,
    tweetSetOfAccounts
  );

router
  .route('/tweetAccountsPublisher')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.publisher,
    ),
    uploadmix,
    resizeImages,
    updateAccountsValidator,
    tweetSetOfAccountsForNotTweet
  );

router
  .route('/tweetsForPublisher/:id')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.manager
    ),
    tweetsSetOfAccountsForPublisher
  );

router
  .route('/tweetsNotPublish')
  .get(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.manager,
    ),
    getTweetsNotPublish
  );

router
  .route('/tweetsNotPublish/:id')
  .get(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.manager,
      roles.publisher,
    ),
    getTweetsForPublisher
  );


router
  .route('/tweet/delete')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.publisher
    ),
    deleteTweetValidator,
    deleteTweett
  );
router
  .route('/tweetAccounts/delete')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.publisher
    ),
    deleteTweetAccountsValidator,
    deleteTweettSet
  );
router
  .route('/retweet')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.publisher
    ),
    reTweetValidator,
    retweetService
  );
router
  .route('/retweet/delete')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    deleteTweetAccountsValidator,
    unretweetService
  );
router
  .route('/like')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.publisher
    ),
    reTweetValidator,
    likeService
  );
router
  .route('/like/delete')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.publisher
    ),
    reTweetValidator,
    unlikeService
  );

router
  .route('/follow')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    followValidator,
    followService
  );
router
  .route('/follow/delete')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    followValidator,
    unfollowService
  );

router
  .route('/reply')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.publisher
    ),
    uploadtxtReplyFile,
    replyValidator,
    replyService
  );
router.route('/resolve').post(
  authService.protect,
  resolveValidator,
  function (req, res, next) {
    req.setTimeout(600000); //set a 20s timeout for this request
    next();
  },
  captcha
);

router
  .route('/tweet/view')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.publisher,
      roles.publisherWriter,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    replyValidator,
    viewTweet
  );
module.exports = router;
