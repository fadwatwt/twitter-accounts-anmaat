const express = require('express');

const {
  getAccountValidator,
  createAccountValidator,
  updateAccountValidator,
  deleteAccountValidator,
  importAccountValidator,
  pindingValidator,
  checkValidator,
  accountDataValidator,
  accountGroupDeleteValidator,
  importInstaAccountValidator,
} = require('../utils/validators/accountValidator');

const {
  getAccounts,
  getAccount,
  getAccountsCount,
  createAccount,
  updateAccount,
  deleteAccount,
  uploadimportFile,
  importAccount,
  getAccountsForInsta,
  importAccountForInsta,
  bindingProxy,
  uploadtxtProxyFile,
  check,
  accountData,
  deleteAccountSet,
  deleteInstaAccountSet,
  newUpadteAccount,
  scopeToSubscriber,
} = require('../services/accountService');

const anmaatAuth = require('../middleware/anmaatAuth');

const router = express.Router();

router
  .route('/tweet')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.list'),
    scopeToSubscriber,
    getAccounts,
  )
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.create'),
    createAccountValidator,
    createAccount,
  );

router
  .route('/tweet/count')
  .get(anmaatAuth.protect, getAccountsCount);

router
  .route('/insta')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.list'),
    scopeToSubscriber,
    getAccountsForInsta,
  );

router
  .route('/:id')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.view'),
    getAccountValidator,
    getAccount,
  )
  .put(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.update'),
    updateAccountValidator,
    newUpadteAccount,
  )
  .delete(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.delete'),
    deleteAccountValidator,
    deleteAccount,
  );

router
  .route('/insta/:id')
  .get(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.view'),
    getAccountValidator,
    getAccount,
  )
  .put(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.update'),
    updateAccountValidator,
    updateAccount,
  )
  .delete(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.delete'),
    deleteAccountValidator,
    deleteAccount,
  );

router.route('/import/tweet').post(
  anmaatAuth.protect,
  anmaatAuth.hasPermission('social_media_accounts.import'),
  uploadimportFile,
  importAccountValidator,
  importAccount,
);

router
  .route('/import/insta')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.import'),
    uploadimportFile,
    importInstaAccountValidator,
    importAccountForInsta,
  );

router
  .route('/binding')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.bind_proxy'),
    uploadtxtProxyFile,
    pindingValidator,
    bindingProxy,
  );

router
  .route('/check')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.update'),
    checkValidator,
    check,
  );

router
  .route('/data')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.view'),
    accountDataValidator,
    accountData,
  );

router
  .route('/delete/tweet')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.delete'),
    accountGroupDeleteValidator,
    deleteAccountSet,
  );

router
  .route('/delete/insta')
  .post(
    anmaatAuth.protect,
    anmaatAuth.hasPermission('social_media_accounts.delete'),
    accountGroupDeleteValidator,
    deleteInstaAccountSet,
  );

module.exports = router;
