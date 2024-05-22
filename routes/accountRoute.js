const express = require('express');
const { roles } = require('../model/roleModel');

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
} = require('../services/accountService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/tweet')
  .get(authService.protect, getAccounts)
  .post(authService.protect, createAccountValidator, createAccount);

router.route('/insta').get(authService.protect, getAccountsForInsta);
router
  .route('/:id')
  .get(authService.protect, getAccountValidator, getAccount)
  .put(authService.protect, updateAccountValidator, updateAccount)
  .delete(authService.protect, deleteAccountValidator, deleteAccount);

router
  .route('/insta/:id')
  .get(authService.protect, getAccountValidator, getAccount)
  .put(authService.protect, updateAccountValidator, updateAccount)
  .delete(authService.protect, deleteAccountValidator, deleteAccount);

router.route('/import/tweet').post(
  authService.protect,
  authService.allowedTo(
    roles.admin,
    roles.manager,
    roles.advancePublisher,
    roles.advancePublisherUpload,
    roles.publisher,
    roles.publisherWriter
  ),
  uploadimportFile,
  importAccountValidator,

  importAccount
);

router
  .route('/import/insta')
  .post(
    authService.protect,
    authService.allowedTo(
      roles.admin,
      roles.manager,
      roles.advancePublisher,
      roles.insta
    ),
    uploadimportFile,
    importInstaAccountValidator,
    importAccountForInsta
  );

router
  .route('/binding')
  .post(
    authService.protect,
    authService.allowedTo(roles.admin, roles.manager),
    uploadtxtProxyFile,
    pindingValidator,
    bindingProxy
  );
router.route('/check').post(authService.protect, checkValidator, check);
router
  .route('/data')
  .post(authService.protect, accountDataValidator, accountData);
router
  .route('/delete/tweet')
  .post(authService.protect, accountGroupDeleteValidator, deleteAccountSet);

router
  .route('/delete/insta')
  .post(
    authService.protect,
    accountGroupDeleteValidator,
    deleteInstaAccountSet
  );
module.exports = router;
