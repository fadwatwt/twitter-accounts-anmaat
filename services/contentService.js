const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');
const User = require('../model/userModel');
const ApiError = require('../utils/apiError');

const {
  uploadMixOfFiles,
  uploadSingleFile,
} = require('../middleware/uploadFilesMiddleware');
const factory = require('./handlersFactory');
const Task = require('../model/contentModel');
const {
  getSpecificFolder,
  getCurrentDateNames,
} = require('../utils/FileHandlers');

exports.uploadTaskFile = uploadMixOfFiles([
  {
    name: 'tweetFile',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 5,
  },
]);

exports.resizeTweetfile = asyncHandler(async (req, res, next) => {
  //console.log(req.files);
  const destt = getSpecificFolder();
  const { month, year } = getCurrentDateNames();

  if (req.files.tweetFile) {
    const FileName = `File-${uuidv4()}_${month}_${year}.txt`;
    const content = req.files.tweetFile[0].buffer.toString();

    if (content.includes('#')) {
      const user = req.body.contentWriting;
      console.log(user);
      const document = await User.findById(user, 'isHashTagAllow').exec();
      if (document.isHashTagAllow === false) {
        return next(new ApiError(`لا يمكنك اضافة هاشتاج الى المحتوى`, 404));
      }
    }
    fs.writeFile(`${destt}/${FileName}`, content, (err) => {
      if (err) throw err;
    });
    // Save image into our db
    req.body.tweetFile = FileName;
  } else {
    return next(new ApiError(`ملف المحتوى مطلوب`, 404));
  }
  //2- Image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `image-${uuidv4()}_${month}_${year}.jpeg`;
        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 95 })
          .toFile(`${destt}/${imageName}`);

        // Save image into our db
        req.body.images.push(imageName);
      })
    );
  }
  req.body.contentWriting = req.user;
  next();
});

// @desc    Get list of Tasks
// @route   GET /api/v1/Tasks
// @access  Private
exports.getTasks = factory.getAll(Task, 'contents');

// @desc    Get specific task by id
// @route   GET /api/v1/Tasks/:id
// @access  private
exports.getTask = factory.getOne(Task, 'users');

// @desc    Create task
// @route   POST  /api/v1/Tasks
// @access  Private
exports.createTask = factory.createOne(Task);
// @desc    Update specific task
// @route   PUT /api/v1/tasks/:id
// @access  Private
exports.updateTask = factory.updateOne(Task);

// @desc    Delete specific product
// @route   DELETE /api/v1/products/:id
// @access  Private
//exports.deleteProduct = factory.deleteOne(Product);

// exports.processTweetfile = asyncHandler(async (req, res, next) => {
//   console.log(req.files.tweetFile[0]);
//   if (req.files.tweetFile) {
//     const file = req.files.tweetFile[0]; // multer gives access to the file object in the request

//     await fs.readFile(file.path, async (err, buff) => {
//       // if any error
//       if (err) {
//         console.error(err);
//         return;
//       }

//       // otherwise log contents
//       const content = buff.toString();
//       if (content.includes("#")) {
//         const user = req.body.contentWriting;
//         console.log(user);
//         const document = await User.findById(user, "isHashTagAllow").exec();
//         console.log(document);
//         if (document.isHashTagAllow == false) {
//           if (fs.existsSync(file.path)) {
//             // The file exists, so you can proceed with deleting it
//             fs.unlink(file.path, (er) => {
//               if (err) {
//                 console.error(err);
//                 return;
//               }

//               console.log("File deleted successfully");
//             });
//           } else {
//             console.log("File not found");
//           }
//           return next(new ApiError(`Can not add hashtag to the tweet`, 404));
//         }
//         //delete images
//       }
//       // remove locally stored image by passing the file's path
//     });
//   }

//   next();
// });
