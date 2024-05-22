const express = require('express');
const { roles } = require('../model/roleModel');

const {
  getJobValidator,
  createJobValidator,
  updateJobValidator,
  deleteJobValidator,
  GroupDeleteValidator,
} = require('../utils/validators/taskValidator');

const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  deleteManyTasks,
  taskDelivery,
  taskRating,
  taskCard,
  getTasksCards,
  getTasksEmployee,
  returnTasksToEmployee,
  deleteCard,
  updateCard
} = require('../services/taskService');


const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(authService.protect, getJobs)
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.manager),
    createJobValidator,
    createJob
  );
router
  .route('/:id')
  .get(authService.protect, getJobValidator, getJob)
  .put(
    authService.protect,
    //authService.allowedTo("admin"),
    updateJobValidator,
    updateJob
  )
  .delete(
    authService.protect,
    authService.allowedTo(roles.admin , roles.manager),
    deleteJobValidator,
    deleteJob
  );
router.post(
  '/delete',
  authService.protect,
  authService.allowedTo(roles.admin , roles.manager),
  GroupDeleteValidator,
  deleteManyTasks
);

router
  .route('/delivery')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.publisherWriter,
      roles.writer,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.admin,
      roles.manager,
    ),
    taskDelivery
  );
router
  .route('/rating')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.manager
    ),
    taskRating
  );

router.route('/cards')
.post(
  authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.manager
    ),
    taskCard
);

router
  .route('/get/cards')
  .get(authService.protect, getTasksCards)

router
  .route('/cards/:id')
  .get(authService.protect, getTasksEmployee)
  .delete( 
    authService.protect,
    authService.allowedTo(roles.admin , roles.manager),
    deleteCard
    )

router
  .route('/cards/:id')
  .put(
    authService.protect,
    authService.allowedTo(roles.admin , roles.manager),
    updateCard
  )

router
  .route('/return')
  .post(authService.protect, returnTasksToEmployee)

module.exports = router;
