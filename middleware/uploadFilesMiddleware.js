const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const multer = require('multer');
const ApiError = require('../utils/apiError');
const {
  getSpecificFolder,
  getCurrentDateNames,
} = require('../utils/FileHandlers');

const multerImageOptions = () => {
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const destt = getSpecificFolder();
      cb(null, destt);
    },
    filename: (req, file, cb) => {
      let FileName;
      const { month, year } = getCurrentDateNames();
      if (req.files.tweetFile) {
        //console.log(req.files.tweetFile)
        //console.log("here")
        //console.log(file)

        FileName = `File-${uuidv4()}_${month}_${year}.txt`;
        if (!req.body.tweetFile) req.body.tweetFile = FileName;
      }
      //2- Image processing for images
      if (req.files.images) {
        if (!req.body.images) req.body.images = [];
        //req.files.images.map(async (img, index) => {
        FileName = `image-${uuidv4()}_${month}_${year}.jpeg`;

        // Save image into our db
        req.body.images.push(FileName);
        //}
        //);
        // Save image into our db
      }
      //console.log(req.body);
      cb(null, FileName);
    },
  });

  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image') || file.mimetype.startsWith('text')) {
      cb(null, true);
    } else {
      cb(new ApiError('فقط الصور أو الملفات النصية مسموح بها', 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  });

  return upload;
};
const multerOptions = () => {
  const multerStorage = multer.memoryStorage();
  const multerFilter = function (req, file, cb) {
    if (
      file.mimetype.startsWith('image') ||
      file.mimetype.startsWith('text') ||
      file.mimetype.startsWith('video')
    ) {
      cb(null, true);
    } else {
      cb(new ApiError('فقط الصور أو الملفات النصية مسموح بها', 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  });

  return upload;
};

const multerCSVOptions = () => {
  const multerStorage = multer.memoryStorage();

  const csvFilter = (_req, file, cb) => {
    // console.log("Reading file in middleware", file.originalname);
    if (file === undefined) {
      cb(new ApiError(' الرجاء قم بتحميل الملف', 400), false);
    } else if (file.mimetype.includes('csv')) {
      cb(null, true);
    } else {
      cb(new ApiError(' csv مسموح فقط ملف واحد', 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: csvFilter,
  });

  return upload;
};

const multerOptionsCSVImage = () => {
  const multerStorage = multer.memoryStorage();
  const multerFilter = function (req, file, cb) {
    if (
      file.mimetype.startsWith('image') ||
      file.mimetype.includes('csv') ||
      file.mimetype.startsWith('video')
    ) {
      cb(null, true);
    } else {
      cb(new ApiError('فقط الصور أوالملفات csv مسموح بها', 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  });

  return upload;
};

const multertxtOptions = () => {
  const multerStorage = multer.memoryStorage();

  const txtFilter = (_req, file, cb) => {
    // console.log("Reading file in middleware", file.originalname);
    if (file === undefined) {
      cb(new ApiError(' الرجاء قم بتحميل الملف', 400), false);
    } else if (file.mimetype.includes('text')) {
      cb(null, true);
    } else {
      cb(new ApiError(' مسموح فقط ملف واحد نصي', 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: txtFilter,
  });

  return upload;
};
const multerSingleImageOptions = () => {
  const multerStorage = multer.memoryStorage();

  const imageFilter = (_req, file, cb) => {
    // console.log("Reading file in middleware", file.originalname);
    if (file === undefined) {
      cb(new ApiError(' الرجاء قم بتحميل الملف', 400), false);
    } else if (file.mimetype.includes('image')) {
      cb(null, true);
    } else {
      cb(new ApiError(' مسموح فقط صورة واحدة', 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: imageFilter,
  });

  return upload;
};
exports.uploadSingleFile = (fieldName) => multerOptions().single(fieldName);

exports.uploadMixOfFiles = (arrayOfFields) =>
  multerOptions().fields(arrayOfFields);
exports.uploadMixTweet = (arrayOfFields) =>
  multerOptionsCSVImage().fields(arrayOfFields);
exports.uploadCSVFile = (fieldName) => multerCSVOptions().single(fieldName);
exports.uploadtxtFile = (fieldName) => multertxtOptions().single(fieldName);
exports.uploadimgFile = (fieldName) =>
  multerSingleImageOptions().single(fieldName);
