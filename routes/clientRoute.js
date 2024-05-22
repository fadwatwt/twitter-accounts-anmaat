const express = require('express');
const authService = require('../services/authService');
const { roles } = require('../model/roleModel');

const {
  serialValidator,
  verifySerialValidator,
} = require('../utils/validators/clientValidator');

const { generateserial, checkSerial } = require('../services/clientService');

const router = express.Router();
//
router.post('/verifySerial', verifySerialValidator, checkSerial);

router.post(
  '/serial',
  authService.protect,
  authService.allowedTo(roles.admin, roles.manager),
  serialValidator,
  generateserial
);

module.exports = router;
