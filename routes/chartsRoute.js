const authService = require('../services/authService');
const { roles } = require('../model/roleModel');
require("express-validator")

const express = require('express');

const {
    getUserCharts,
    getAdminCharts,
    test
} = require('../services/chartsService');
const router = express.Router();


router.route('/').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.writer,
        roles.publisher,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.manager,
    ),
    getUserCharts
);

router.route('/admin').get(
    authService.protect,
    authService.allowedTo(
        roles.admin,
        roles.manager
    ),
    getAdminCharts
);

router.route('/admin/test').get(
    authService.protect,
    authService.allowedTo(
        roles.admin,
        roles.manager
    ),
    test
);

module.exports = router;
