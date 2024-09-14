const express = require('express');
const { roles } = require('../model/roleModel');
const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  descendantsCategoryValidator,
  createInstaCategoryValidator,
  updateInstaCategoryValidator,
  moveCategoryValidator,
} = require('../utils/validators/accountCategoryValidator');

const {
  getAccountCategories,
  getAccountCategory,
  createAccountCategory,
  updateAccountCategory,
  deleteAccountCategory,
  moveCategory,
  descendants,
  getInstaAccountCategories,
  getInstaAccountCategory,
  createInstaAccountCategory,
  updateInstaAccountCategory,
  deleteInstaAccountCategory,
  moveInstaCategory,
  instaDescendants, deleteCategoryAccountSet, deleteCategoryInstaAccountSet
} = require('../services/accountCategoryService');

const authService = require('../services/authService');
const { categoryGroupDeleteValidator } = require('../utils/validators/categoryValidator');
const { deleteCategorySet } = require('../services/categoryService');

const router = express.Router();
router
  .route('/descendants')
  .get(authService.protect, descendantsCategoryValidator, descendants);
  router
  .route('/insta/descendants')
  .get(authService.protect, descendantsCategoryValidator, instaDescendants);
router
  .route('/move')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    moveCategoryValidator,
    moveCategory
  );

  router
  .route('/insta/move')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    moveCategoryValidator,
    moveInstaCategory
  );

router
  .route('/')
  .get(authService.protect, getAccountCategories)
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    createCategoryValidator,
    createAccountCategory
  );

  router
  .route('/insta')
  .get(authService.protect, getInstaAccountCategories)
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    createInstaCategoryValidator,
    createInstaAccountCategory
  );

router
  .route('/:id')
  .get(authService.protect, getCategoryValidator, getAccountCategory)
  .put(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    updateCategoryValidator,
    updateAccountCategory
  )
  .delete(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    deleteCategoryValidator,
    deleteAccountCategory
  );

  router
  .route('/insta/:id')
  .get(authService.protect, getCategoryValidator, getInstaAccountCategory)
  .put(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    updateInstaCategoryValidator,
    updateInstaAccountCategory
  )
  .delete(
    authService.protect,
    authService.allowedTo(roles.admin, roles.advancePublisherUpload),
    deleteCategoryValidator,
    deleteInstaAccountCategory
  );

router
  .route('/someDelete')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin,roles.manager),
    categoryGroupDeleteValidator,
    deleteCategoryAccountSet
  );
router
  .route('/insta/someDelete')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin,roles.manager),
    categoryGroupDeleteValidator,
    deleteCategoryInstaAccountSet
  );


module.exports = router;
