const express = require('express');
const controller = require('../../../controllers/front/users.controller');
const router = express.Router();
const { profileUpload, uploadSingle } = require('../../../utils/upload');

router.route('/').post(controller.create);
router.route('/').put(profileUpload, controller.update);
router.route('/creators').post(controller.getCreators);
router.route('/top-sellers').post(controller.topSellers);
router.route('/:userId').get(controller.getUser);
router.route('/createUser').post(uploadSingle, controller.createUser);
router.route('/addEmail').post(controller.addEmail);

module.exports = router;
