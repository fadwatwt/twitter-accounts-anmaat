const express = require('express');
const { roles } = require('../model/roleModel');

const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  categoryGroupDeleteValidator,
} = require('../utils/validators/categoryValidator');

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteCategorySet,
  getInstaCategory,
  getInstaCategories,
  createInstaCategory,
  updateInstaCategory,
  deleteInstaCategory,
  deleteInstaCategorySet, uploadFiles, deleteFileCategory,
} = require('../services/categoryService');

const authService = require('../services/authService');

const router = express.Router();
// createCategoryValidator,

router
  .route('/')
  .get(authService.protect, getCategories)
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload ,roles.manager),
    uploadFiles,
    createCategory
  );

  router.route('/insta').get(authService.protect, getInstaCategories)
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    createCategoryValidator,
    createInstaCategory
  );
router
  .route('/:id')
  .get(authService.protect, getCategoryValidator, getCategory)
  .put(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    updateCategoryValidator,uploadFiles,
    updateCategory
  )
  .delete(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    deleteCategoryValidator,
    deleteCategory
  );

  router.route('/insta/:id')
  .get(authService.protect, getCategoryValidator, getInstaCategory)
  .put(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    updateCategoryValidator,
    updateInstaCategory
  )
  .delete(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    deleteCategoryValidator,
    deleteInstaCategory
  );

router
  .route('/delete')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    categoryGroupDeleteValidator,
    deleteCategorySet
  );
  router
  .route('/insta/delete')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    categoryGroupDeleteValidator,
    deleteInstaCategorySet
  );

  router.route('/delete/file').post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload,roles.manager),
    deleteFileCategory
  )
module.exports = router;
