const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactory');
const attandance = require('../model/attandanceModel');

// @desc    Get list of attandance
// @route   GET /api/v1/attandances
// @access  Private
exports.getAttandances = factory.getAll(attandance);

// @desc    Get specific attandance by id
// @route   GET /api/v1/attandances/:id
// @access  Private
exports.getAttandance = factory.getOne(attandance);

// @desc    Create attandance
// @route   POST  /api/v1/attandances
// @access  Private
exports.createAttandance = factory.createOne(attandance, 'Attendance');

// @desc    Update specific attandance
// @route   PUT /api/v1/attandances/:id
// @access  Private
exports.updateAttandance = factory.updateOne(attandance);

// @desc    Delete specific attandance
// @route   DELETE /api/v1/attandances/:id
// @access  Private
exports.deleteAttandance = factory.deleteOne(attandance);

exports.getTotalHours = asyncHandler(async (req, res, next) => {
  const d = await attandance.aggregate([
    {
      $addFields: {
        start: { $toDate: '$start' },
        end: { $toDate: '$end' },
        date: { $toDate: '$date' },
        dayworking: {
          $map: {
            input: {
              $range: [
                0,
                {
                  $ceil: {
                    $divide: [
                      {
                        $subtract: [{ $toDate: '$end' }, { $toDate: '$start' }],
                      },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                },
              ],
            },
            in: {
              $toDate: {
                $add: [
                  { $multiply: ['$$this', 1000 * 60 * 60 * 24] },
                  {
                    $subtract: [
                      { $toLong: { $toDate: '$start' } },
                      {
                        $mod: [
                          { $toLong: { $toDate: '$start' } },
                          1000 * 60 * 60 * 24,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
    { $unwind: '$dayworking' },

    {
      $group: {
        _id: {
          user: '$user',
          day: '$dayworking',
        },
        hours: {
          $sum: {
            $floor: {
              $divide: [
                {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $and: [
                            { $lt: ['$dayworking', '$start'] },
                            {
                              $gt: [
                                {
                                  $add: ['$dayworking', 1000 * 60 * 60 * 24],
                                },
                                '$end',
                              ],
                            },
                          ],
                        },
                        then: { $subtract: ['$end', '$start'] },
                      },
                      {
                        case: {
                          $lt: [
                            '$end',
                            { $add: ['$dayworking', 1000 * 60 * 60 * 24] },
                          ],
                        },
                        then: {
                          $subtract: ['$end', '$dayworking'],
                        },
                      },
                      {
                        case: { $lt: ['$dayworking', '$start'] },
                        then: {
                          $subtract: [
                            { $add: ['$dayworking', 1000 * 60 * 60 * 24] },
                            '$start',
                          ],
                        },
                      },
                    ],
                    default: 1000 * 60 * 60 * 24,
                  },
                },
                1000 * 60 * 60,
              ],
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.user',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, email: 1 } }],
        as: 'user',
      },
    },
    { $sort: { _id: 1 } },
  ]);
  //console.log(d);

  res.status(200).json({ data: d });
});
