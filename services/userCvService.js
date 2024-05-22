const asyncHandler = require('express-async-handler');
const UserCv = require('../model/userCvModel');


exports.getCv = asyncHandler(async (req, res, next) => {
    try{
        const user_id = req.params.user_id;
        const cv = await UserCv.findOne({ user_id: user_id });
        res.status(200).json({ data: cv });
        
    }catch(e){ 
        console.log(e)
    }
});

exports.createCv = asyncHandler(async (req, res, next) => {
    try{
        const user_cv = await UserCv.create({
            user_id : req.body.user_id,
            name: req.body.name,
            email: req.body.email,
            address: req.body.address,
            phone: req.body.phone,
            job_name : req.body.job_name
        });

        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.updateCv = asyncHandler(async (req, res, next) => {
    try{
        await UserCv.updateOne(
            { _id: req.body.id },
            { $set: {
                name : req.body.name,
                email: req.body.email,
                address: req.body.address,
                phone: req.body.phone,
                job_name : req.body.job_name
            } } // Updated fields
        );
        const user_cv = await UserCv.findOne({ _id: req.body.id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.updateCvAbout = asyncHandler(async (req, res, next) => {
    try{
        await UserCv.updateOne(
            { _id: req.body.id },
            { $set: {about : req.body.about} } // Updated fields
        );
        const user_cv = await UserCv.findOne({ _id: req.body.id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.expertiseCv = asyncHandler(async (req, res, next) => {
    try{
        console.log(req.body)
        await UserCv.updateOne(
            { _id: req.body.id },
            { $push: { expertise: req.body.expertise } },
        );
        const user_cv = await UserCv.findOne({ _id: req.body.id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.langCv = asyncHandler(async (req, res, next) => {
    try{
        await UserCv.updateOne(
            { _id: req.body.id },
            { $push: { lang: req.body.lang } },
        );
        const user_cv = await UserCv.findOne({ _id: req.body.id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.educationCv = asyncHandler(async (req, res, next) => {
    try{
        await UserCv.updateOne(
            { _id: req.body.id },
            { $push: { education: req.body.education} },
        );
        const user_cv = await UserCv.findOne({ _id: req.body.id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.experinceCv = asyncHandler(async (req, res, next) => {
    try{
        await UserCv.updateOne(
            { _id: req.body.id },
            { $push: { work_experience: req.body.experince} },
        );
        const user_cv = await UserCv.findOne({ _id: req.body.id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.deleteEducationCv = asyncHandler(async (req, res, next) => {
    try{

        const id  = req.params.id;
        const education_id  = req.params.education_id;
        const data = await UserCv.findOne({ _id: id });  
        data.education.splice(education_id , 1);
        await UserCv.updateOne({ _id: id }, { $set: {education : data.education} });
        const user_cv = await UserCv.findOne({ _id: id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.deleteExperinceCv = asyncHandler(async (req, res, next) => {
    try{

        const id  = req.params.id;
        const experince_id  = req.params.experince_id;
        const data = await UserCv.findOne({ _id: id });  
        data.work_experience.splice(experince_id , 1);
        await UserCv.updateOne({ _id: id }, { $set: {work_experience : data.work_experience} });
        const user_cv = await UserCv.findOne({ _id: id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.deleteExpertiseCv = asyncHandler(async (req, res, next) => {
    try{
        const id  = req.params.id;
        const expertise_id  = req.params.expertise_id;
        const data = await UserCv.findOne({ _id: id });  
        data.expertise.splice(expertise_id , 1);
        await UserCv.updateOne({ _id: id }, { $set: {expertise : data.expertise} });
        const user_cv = await UserCv.findOne({ _id: id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});

exports.DeleteLangCvAction = asyncHandler(async (req, res, next) => {
    try{
        const id  = req.params.id;
        const lang_id  = req.params.lang_id;
        const data = await UserCv.findOne({ _id: id });  
        data.lang.splice(lang_id , 1);
        await UserCv.updateOne({ _id: id }, { $set: {lang : data.lang} });
        const user_cv = await UserCv.findOne({ _id: id });
        res.status(200).json({ data: user_cv });
    }catch(e){ 
        console.log(e)
    }
});


