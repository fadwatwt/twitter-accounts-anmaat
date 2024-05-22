const authService = require('../services/authService');
const { roles } = require('../model/roleModel');
require("express-validator")

const express = require('express');

const {
    getCv ,createCv ,updateCvAbout ,expertiseCv ,langCv ,educationCv ,
     experinceCv, deleteEducationCv ,deleteExperinceCv, deleteExpertiseCv ,
     DeleteLangCvAction, updateCv
} = require('../services/userCvService');


const router = express.Router();

router.route('/')
    .post(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
        ),
        createCv
    );

router.route('/update')
    .post(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
        ),
        updateCv
    );

router.route('/about')
    .post(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
        ),
        updateCvAbout
);

router.route('/expertise')
    .post(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
        ),
        expertiseCv
);

router.route('/expertise/delete/:id/:expertise_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
      ),
      deleteExpertiseCv
)

router.route('/lang')
    .post(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
        ),
        langCv
    );

    router.route('/lang/delete/:id/:lang_id').get(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
          ),
          DeleteLangCvAction
    )

    

router.route('/education')
    .post(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
        ),
        educationCv
    );

    router.route('/education/delete/:id/:education_id').get(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
          ),
        deleteEducationCv
    )

router.route('/experince')
    .post(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
        ),
        experinceCv
    );
    router.route('/experince/delete/:id/:experince_id').get(
        authService.protect,
        authService.allowedTo(
            roles.publisherWriter,
            roles.writer,
            roles.advancePublisher,
            roles.advancePublisherUpload,
            roles.admin,
          ),
          deleteExperinceCv
    )

    

router.route('/:user_id').get(
    authService.protect,
    authService.allowedTo(
        roles.publisherWriter,
        roles.writer,
        roles.advancePublisher,
        roles.advancePublisherUpload,
        roles.admin,
      ),
    getCv
)



module.exports = router;
