const asyncHandler = require('express-async-handler');


exports.test = asyncHandler(async (req, res, next) => {
    try{
        // res.status(200).json({ data: TaskInfo});
    }catch(e) {
        console.log(e)
    }
});

