const express = require("express");
const router = express.Router();
const listController = require("../controllers/listController");
const verifyJWT = require("../middlewares/verifyJWT");
const { verifyRoles } = require("../middlewares/verifyRoles");

router.use(verifyJWT);

router.route("/create").post(verifyRoles("admin", "leader"), listController.createList);
router.route("/project/:projectId").get(listController.getListsByProject);
router.route("/update/:id").put(verifyRoles("admin", "leader"), listController.updateList);
router.route("/delete/:id").delete(verifyRoles("admin", "leader"), listController.deleteList);

module.exports = router;
