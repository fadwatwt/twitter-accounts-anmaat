const mongoose = require('mongoose');
const FileHandlers = require('../utils/FileHandlers');
const { State } = require('./stateModel');

const contentSchema = new mongoose.Schema(
  {
    tweetFile: {
      type: String,
      required: [true, 'ملف المحتوى مطلوب'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'التصنيف مطلوب'],
    },
    images: [String],
    contentWriting: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'كاتب المحتوى مطلوب'],
    },
    state: {
      type: String,
      enum: Object.values(State),
      default: State.Add,
      message: 'قيمة الحالة خاطئة',
    },
    supervisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
    },
    TaskApprovedAt: Date,
  },

  {
    timestamps: true,
    // to enable virtual populate
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Mongoose query middleware
contentSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: 'name',
  });
  this.populate({
    path: 'contentWriting',
    select: 'name',
  });
  this.populate({
    path: 'supervisor',
    select: 'name',
  });
  next();
});

const setImageURL = (doc) => {
  if (doc.tweetFile) {
    const subDirectories = FileHandlers.extractYearMonthFromFile(doc.tweetFile);
    const imageUrl = `${subDirectories}/${doc.tweetFile}`;
    doc.tweetFile = imageUrl;
  }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      const subDirectories = FileHandlers.extractYearMonthFromFile(image);

      const imageUrl = `${subDirectories}/${image}`;
      imagesList.push(imageUrl);
    });
    doc.images = imagesList;
  }
};
// findOne, findAll and update
contentSchema.post('init', (doc) => {
  setImageURL(doc);
});

// create
contentSchema.post('save', (doc) => {
  setImageURL(doc);
});

Object.assign(contentSchema.statics, {
  State,
});
const Content = mongoose.model('Content', contentSchema);
contentSchema.pre('deleteOne', async function (next) {
  const id = this._conditions._id;
  const docs = await Content.findById(id);
  if (docs) {
    if (docs.tweetFile) {
      const subDirectories = FileHandlers.extractYearMonthFromFile(
        doc.tweetFile
      );
      const imageUrl = `${subDirectories}/${doc.tweetFile}`;
    }
    if (docs.images) {
      docs.images.forEach((image) => {
        const subDirectories = FileHandlers.extractYearMonthFromFile(image);

        const imageUrl = `${subDirectories}/${image}`;
      });
    }
  }
});
module.exports = Content;
