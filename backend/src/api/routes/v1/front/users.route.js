const express = require('express');
const controller = require('../../../controllers/front/users.controller');
const router = express.Router();
const { profileUpload, uploadSingle } = require('../../../utils/uploadImage');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
router.route('/').post(controller.create);
router.route('/updateProfile').put(profileUpload, controller.updateProfile);
router.route('/creators').post(controller.getCreators);
router.route('/top-sellers').get(controller.topSellers);
router.route('/:userId').get(controller.getUser);
router.route('/subscribe').post(controller.subscribeUser);

module.exports = router;
