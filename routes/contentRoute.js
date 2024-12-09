const express = require('express');
const { roles } = require('../model/roleModel');

const {
  resizeTweetfile,
} = require('../services/contentService');
const authService = require('../services/authService');

const router = express.Router();

//   .delete(
//     authService.protect,
//     authService.allowedTo("admin"),
//     deleteProductValidator,
//     deleteProduct
//   );

module.exports = router;
