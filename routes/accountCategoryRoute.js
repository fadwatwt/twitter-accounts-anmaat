const express = require('express');
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
  instaDescendants,
  deleteCategoryAccountSet,
  deleteCategoryInstaAccountSet,
  scopeCategoriesToSubscriber,
} = require('../services/accountCategoryService');

const anmaatAuth = require('../middleware/anmaatAuth');
const { categoryGroupDeleteValidator } = require('../utils/validators/categoryValidator');

const router = express.Router();

router
  .route('/descendants')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.list'),
    scopeCategoriesToSubscriber,
    descendantsCategoryValidator,
    descendants,
  );

router
  .route('/insta/descendants')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.list'),
    descendantsCategoryValidator,
    instaDescendants,
  );

router
  .route('/move')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.update'),
    moveCategoryValidator,
    moveCategory,
  );

router
  .route('/insta/move')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.update'),
    moveCategoryValidator,
    moveInstaCategory,
  );

router
  .route('/')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.list'),
    scopeCategoriesToSubscriber,
    getAccountCategories,
  )
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.create'),
    createCategoryValidator,
    createAccountCategory,
  );

router
  .route('/insta')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.list'),
    getInstaAccountCategories,
  )
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.create'),
    createInstaCategoryValidator,
    createInstaAccountCategory,
  );

router
  .route('/:id')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.list'),
    getCategoryValidator,
    getAccountCategory,
  )
  .put(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.update'),
    updateCategoryValidator,
    updateAccountCategory,
  )
  .delete(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.delete'),
    deleteCategoryValidator,
    deleteAccountCategory,
  );

router
  .route('/insta/:id')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.list'),
    getCategoryValidator,
    getInstaAccountCategory,
  )
  .put(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.update'),
    updateInstaCategoryValidator,
    updateInstaAccountCategory,
  )
  .delete(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.delete'),
    deleteCategoryValidator,
    deleteInstaAccountCategory,
  );

router
  .route('/someDelete')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.delete'),
    categoryGroupDeleteValidator,
    deleteCategoryAccountSet,
  );

router
  .route('/insta/someDelete')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_categories.delete'),
    categoryGroupDeleteValidator,
    deleteCategoryInstaAccountSet,
  );

module.exports = router;
