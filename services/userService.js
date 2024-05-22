const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');

const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { uploadSingleFile } = require('../middleware/uploadFilesMiddleware');
const createToken = require('../utils/createToken');
const User = require('../model/userModel');

// Upload single image
exports.uploadUserImage = uploadSingleFile('profileImg');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/images/${filename}`);

    // Save image into our db
    req.body.profileImg = `images/${filename}`;
  }

  next();
});

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private
exports.getUsers = factory.getAll(User, 'users');
// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = factory.getOne(User);

// @desc    Create user
// @route   POST  /api/v1/users
// @access  Private/Admin
exports.createUser = factory.createOne(User);

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug,
      phone: req.body.phone,
      email: req.body.email,
      profileImg: req.body.profileImg,
      type: req.body.type,
      holidays: req.body.holidays,
      role: req.body.role,
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`لا يوجد موظف لهذا الرقم ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});
// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUserCategory = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.body.id,
    {
      Category: req.body.category,
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`لا يوجد موظف لهذا الرقم ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`لا يوجد موظف لهذا الرقم ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = factory.deleteOne(User);

// @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/Protect
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc    Update logged user password
// @route   PUT /api/v1/users/updateMyPassword
// @access  Private/Protect
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // 1) Update user password based user payload (req.user._id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  // 2) Generate token
  const token = createToken(user._id);

  res.status(200).json({ data: user, token });
});

// @desc    Update logged user data (without password, role)
// @route   PUT /api/v1/users/updateMe
// @access  Private/Protect
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    },
    { new: true }
  );

  res.status(200).json({ data: updatedUser });
});

// @desc    Deactivate logged user
// @route   DELETE /api/v1/users/deleteMe
// @access  Private/Protect
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: 'Success' });
}); // @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUserAllowHashTag = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.body.id,
    {
      isHashTagAllow: req.body.allowHashTag,
    },
    {
      new: true,
    }
  );

  if (!document) {
    return next(new ApiError(`لا يوجد موظف لهذا الرقم ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.updateUserAdmin = factory.updateOne(User);
/////delete set of users
// @route   POST /api/v1/users/delete
// @access  Private
exports.deleteManyUser = asyncHandler(async (req,res) => {
  const { ids } = req.body;
   const result = await User.deleteMany({_id: { $in: ids} })

  if (result.deletedCount > 0) {
    res.status(200).json({ success: true, message: ` تم حذف عدد ${result.deletedCount} من الموظفين بنجاح ` });
  } else {
    res.status(404).json({ success: false, message: "لا يوجد موظفين للحذف." });
  }

})

exports.searchUses = asyncHandler(async (req, res, next) => {
  const name = req.params.name;
  // name = name.toLowerCase();
  // console.log(name)
  const users = await User.find(
    { name: { $regex: '.*' + name + '.*', $options: 'i' } },
    { _id: 1, name: 1 }
  ).limit(5);
  res.status(200).json(users);
});

exports.getUserName = asyncHandler(async (req, res, next) => {
  const user_id = req.params.id;
  console.log(user_id);
  const user = await User.find({ _id: user_id }, { name: 1 });
  console.log(user);
  res.status(200).json(user);
});
