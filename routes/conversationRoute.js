const authService = require('../services/authService');
const { roles } = require('../model/roleModel');
require("express-validator")

const multer = require('multer');

const express = require('express');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/conversations') // Save files to the 'uploads' directory
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname) // Generate unique file name
    }
});

const uploadChatMedia = multer({ storage: storage });

const {
    createChat,getConversations,getConversation,createMessage ,getUnreadMessages,SetReadMessages ,getPerformRate,
  createMeeting
} = require('../services/conversationService');
const { uploadmix } = require('../services/twitterService');


const router = express.Router();

router.route('/chat')
    .post(
        authService.protect,
        authService.allowedTo(roles.admin , roles.manager),
        createChat
    );

router.route('/meeting')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin , roles.manager),
    createMeeting
  );

router.route('/:user_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.writer,
        roles.publisher,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
        roles.manager
      ),
    getConversations
)

router.route('/chat/:chat_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.publisher,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
        roles.manager
      ),
    getConversation
)

router.route('/unread/:user_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.publisher,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
        roles.manager
      ),
    getUnreadMessages
)

router.route('/markread/:user_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
        roles.manager
      ),
    SetReadMessages
)

router.route('/message')
    .post(
        authService.protect,
        uploadChatMedia.array('images'),
        createMessage,
        uploadmix,
    );

router.route('/performrate/:user_id').get(
    authService.protect,
    authService.allowedTo(
        roles.manager,
        roles.admin,
        ),
    getPerformRate
)

module.exports = router;
