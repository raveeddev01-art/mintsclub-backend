const router = require("express").Router();
const controller = require("../../../controllers/admin/systemSetting.controller");
const auth = require('../../../middlewares/front/adminPannelAuth')
router.post("/addSystemSetting" ,controller.addSystemSetting);
router.get("/getAllSystemSetting" ,auth.adminAuth ,controller.getSystemSetting);
router.post("/updateSystemSetting",auth.adminAuth , controller.updateSystemSetting);

module.exports = router;