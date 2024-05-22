const express = require('express');
const {
  getTaskValidator,
  createTaskValidator,
  updateTaskValidator,
} = require('../utils/validators/contentValidator');
const { roles } = require('../model/roleModel');

const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  uploadTaskFile,
  resizeTweetfile,
} = require('../services/contentService');
const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(authService.protect, getTasks)
  .post(
    authService.protect,
    authService.allowedTo(
      roles.publisherWriter,
      roles.writer,
      roles.advancePublisher,
      roles.advancePublisherUpload
    ),
    uploadTaskFile,
    resizeTweetfile,
    createTaskValidator,
    createTask
  );
router.route('/:id').get(getTaskValidator, getTask).put(
  authService.protect,
  authService.allowedTo(roles.admin, roles.manager),
  uploadTaskFile,
  //resizeTweetfile,
  updateTaskValidator,
  updateTask
);
//   .delete(
//     authService.protect,
//     authService.allowedTo("admin"),
//     deleteProductValidator,
//     deleteProduct
//   );

module.exports = router;
