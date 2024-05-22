const express = require('express');
const { roles } = require('../model/roleModel');
const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedUserValidator,
  updateUserCategoryValidator,
  setHashTagAllow,
  GroupDeleteValidator,
} = require('../utils/validators/userValidator');

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserImage,
  resizeImage,
  changeUserPassword,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  deleteLoggedUserData,
  updateUserCategory,
  updateUserAllowHashTag,
  updateUserAdmin,
  deleteManyUser,
  searchUses,
  getUserName
} = require('../services/userService');

const authService = require('../services/authService');

const router = express.Router();

router.use(authService.protect);

router.get('/getMe', getLoggedUserData, getUser);
router.put('/changeMyPassword', updateLoggedUserPassword);
router.put('/updateMe', updateLoggedUserValidator, updateLoggedUserData);
router.delete('/deleteMe', deleteLoggedUserData);
///
router.put(
  '/changeCategory',
  authService.allowedTo(roles.admin, roles.manager),
  updateUserCategoryValidator,
  updateUserCategory
);
router.put(
  '/changeHashTagAllow',
  authService.allowedTo(roles.admin,roles.manager),
  setHashTagAllow,
  updateUserAllowHashTag
);

// Admin
router.use(authService.allowedTo(roles.admin, roles.manager));

router.put(
  '/changePassword/:id',
  changeUserPasswordValidator,
  changeUserPassword
);
router
  .route('/')
  .get(getUsers)

  .post(uploadUserImage, resizeImage, createUserValidator, createUser);
router
  .route('/:id')
  .get(getUserValidator, getUser)
  .put(updateUserValidator, updateUserAdmin)

  //.put(uploadUserImage, resizeImage, updateUserValidator, updateUser)
  .delete(deleteUserValidator, authService.allowedTo(roles.admin , roles.manager), deleteUser);
router
  .route('/delete')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin , roles.manager),
    GroupDeleteValidator,
    deleteManyUser
  );

  router.route('/search/:name').get(
    authService.protect,
    authService.allowedTo(roles.admin, roles.manager),
    searchUses
  )

  router.route('/user/:id').get(
    authService.protect,
    authService.allowedTo(
      roles.publisherWriter,
      roles.writer,
      roles.advancePublisher,
      roles.advancePublisherUpload,
      roles.manager,
      roles.admin,
    ),
    getUserName
  )
module.exports = router;
