const fs = require('fs');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleware/validatorMiddleware');
const fileHandler = require('../FileHandlers');

exports.readFileValidator = [
  check('fileName')
    .notEmpty()
    .withMessage('اسم الملف مطلوب')
    .custom((val, { req }) => {
      if (!val.endsWith('txt')) {
        return Promise.reject(new Error(`يقبل ملف نصي فقط ${val}`));
      }
    })
    .custom((val, { req }) => {
      const filePath = fileHandler.getFileFullPath(val);
      if (!fs.existsSync(filePath)) {
        return Promise.reject(new Error(`لا يوجد ملف بهذا الاسم ${filePath}`));
      }
    }),
  //validatorMiddleware,
];

exports.writeFileValidator = [
  check('fileName')
    .notEmpty()
    .withMessage('اسم الملف مطلوب')
    .custom((val, { req }) => {
      if (!val.endsWith('txt')) {
        return Promise.reject(new Error(`يقبل ملف نصي فقط ${val}`));
      }
    })
    .custom((val, { req }) => {
      const filePath = fileHandler.getFileFullPath(val);
      console.log(filePath);
      if (!fs.existsSync(filePath)) {
        return Promise.reject(new Error(`لايوجد ملف بهذا الاسم ${filePath}`));
      }
    }),
  check('text').notEmpty().withMessage('النص مطلوب'),
  // validatorMiddleware,
];
