const express = require('express');
const { roles } = require('../model/roleModel');

const {
  getAttandanceValidator,
  createAttandanceValidator,
  updateAttandanceValidator,
  deleteAttandanceValidator,
} = require('../utils/validators/attandanceValidator');

const {
  getAttandances,
  getAttandance,
  createAttandance,
  updateAttandance,
  deleteAttandance,
  getTotalHours,
} = require('../services/attandanceService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(authService.protect, getAttandances)
  .post(authService.protect, createAttandanceValidator, createAttandance);
router
  .route('/getTotalHours')
  .get(authService.protect, authService.allowedTo(roles.admin), getTotalHours);
router
  .route('/:id')
  .get(authService.protect, getAttandanceValidator, getAttandance)

  .put(authService.protect, updateAttandanceValidator, updateAttandance)
  .delete(
    authService.protect,
    authService.allowedTo(roles.admin),
    /// deleteAttandanceValidator,
    deleteAttandance
  );

module.exports = router;
