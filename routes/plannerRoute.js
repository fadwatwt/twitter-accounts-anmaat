const authService = require('../services/authService');
const { roles } = require('../model/roleModel');
require("express-validator")

const express = require('express');

const {
    getTasks,
    getUsersTasks
} = require('../services/plannerServices');


const router = express.Router();

router.route('/').get(
    authService.protect,
    authService.allowedTo(roles.admin , roles.manager),
    getTasks
)

router.route('/:user_id').get(
    authService.protect,
    authService.allowedTo(roles.publisherWriter,
        roles.publisher,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.manager),
    getUsersTasks
)

module.exports = router;
