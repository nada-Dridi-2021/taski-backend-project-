const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskControllers"); // Adjust the path as necessary
const verifyJWT = require("../middlewares/verifyJWT");
const {verifyRoles} = require("../middlewares/verifyRoles");

router.use(verifyJWT);
router.route("/create").post(verifyRoles('admin', 'leader'),taskController.createTask);
router.route("/:id").get(verifyRoles('admin', 'leader'),taskController.getTaskById);
router.route("/update/:id").put(taskController.updateTask);
router.route("/delete/:id").delete(verifyRoles('admin', 'leader'),taskController.deleteTask);
router.route("/upload/:id").post(taskController.uploadFileToTask);
router.route("/:id/attachments").get(taskController.getTaskAttachments);
router.route("/:id/attachments/:attachmentId").delete(taskController.deleteAttachment);

module.exports = router;
