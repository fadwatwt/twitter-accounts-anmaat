const authService = require('../services/authService');
const { roles } = require('../model/roleModel');
require("express-validator")

const express = require('express');

const {
    createNotification, getNotifications,reedNotifications
} = require('../services/notificationService');


const router = express.Router();

router.route('/')
    .post(
        authService.protect,
        authService.allowedTo(roles.admin , roles.manager,),
        createNotification
    );

router.route('/:user_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
        roles.manager,
      ),
    getNotifications
)

router.route('/read/:user_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
        roles.manager,

      ),
    reedNotifications
)

module.exports = router;
