const express = require('express');
const { roles } = require('../model/roleModel');

const {
  getTaskInfoValidator,
  createTaskInfoValidator,
  updateTaskInfoValidator,
  deleteTaskInfoValidator,
} = require('../utils/validators/taskInfoValidator');

const {
  getTaskInfos,
  getTaskInfo,
  createTaskInfo,
  updateTaskInfo,
  deleteTaskInfo,
} = require('../services/taskInfoService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  //.get(authService.protect, getCategories)
  .get(authService.protect, getTaskInfos)
  .post(
    authService.protect,
    authService.allowedTo(roles.publisher, roles.publisherWriter),
    createTaskInfoValidator,
    createTaskInfo
  );
router
  .route('/:id')
  //.get(authService.protect, getCategoryValidator, getCategory)
  .get(authService.protect, getTaskInfoValidator, getTaskInfo)
  .put(
    authService.protect,
    authService.allowedTo(
      roles.publisher,
      roles.publisherWriter,
      roles.manager
    ),
    updateTaskInfoValidator,
    updateTaskInfo
  )
  .delete(
    authService.protect,
    authService.allowedTo(
      roles.publisher,
      roles.publisherWriter,
      roles.manager
    ),
    deleteTaskInfoValidator,
    deleteTaskInfo
  );

module.exports = router;
