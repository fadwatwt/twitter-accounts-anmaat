const asyncHandler = require('express-async-handler');
const licenseKey = require('license-key-gen');

const ApiError = require('../utils/apiError');
const Client = require('../model/clientModel');
const createSerial = require('../utils/createSerial');

// @desc    give generate serial
// @route   Post /api/v1/clients/serial
// @access  private/admin
exports.generateserial = asyncHandler(async (req, res, next) => {
  // 1- generate serial
  const data = { email: req.body.email };
  const serial = await createSerial(data);
  if (serial.errorCode !== 0) {
    return next(new ApiError(serial.message, 401));
  }
  /// create client
  const client = await Client.create({
    email: req.body.email,
    Serial: serial.license,
  });
  res.status(201).json({ data: client });
});

// @desc    check serial
// @route   POST /api/v1/clients/verifySerial
// @access  Public
exports.checkSerial = asyncHandler(async (req, res, next) => {
  // 1) check if serial and email in the body (validation)
  // 2) check if client exist & check if serial is correct
  const client = await Client.findOne({
    email: req.body.email,
    Serial: req.body.serial,
  });
  const licenseData = {
    info: { email: client.email },
    prodCode: 'ProTweet123',
    osType: 'WIN10',
  };
  const license = licenseKey.validateLicense(licenseData, req.body.serial);
  if (!client || license.errorCode !== 0) {
    return next(new ApiError('Incorrect email or serial', 401));
  }
  if (client.macAddress && client.macAddress != req.body.macAddress) {
    return next(new ApiError('The client already active the serial', 401));
  }

  // update client
  if (!client.macAddress) {
    client.name = req.body.name;
    client.macAddress = req.body.macAddress;
    client.active = true;
    await client.save();
  }
  // 4) send response to client side
  res.status(200).json({ data: client });
});
