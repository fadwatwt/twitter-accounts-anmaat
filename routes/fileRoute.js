const express = require('express');
const { roles } = require('../model/roleModel');

const {
  readFileValidator,
  writeFileValidator,
} = require('../utils/validators/fileValidator');

const { readFile, WriteFile, deleteFile } = require('../services/fileService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(
    authService.protect,
    authService.allowedTo(roles.admin, roles.manager),
    readFileValidator,
    readFile
  )
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.manager),
    writeFileValidator,
    WriteFile
  ).delete(
    authService.protect,
  authService.allowedTo(roles.admin, roles.manager),
  deleteFile
);

module.exports = router;
