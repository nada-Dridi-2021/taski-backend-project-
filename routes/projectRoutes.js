const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const verifyJWT = require("../middlewares/verifyJWT");
const {verifyRoles} = require("../middlewares/verifyRoles");

router.use(verifyJWT);

router.route("/create").post(verifyRoles('admin', 'leader'),projectController.createProject);
router.route("/all").get(projectController.getProjects);
router.route("/:id").get(projectController.getProjectById);
router.route("/update/:id").put(verifyRoles('admin', 'leader'),projectController.updateProject);
router.route("/delete/:id").delete(verifyRoles('admin', 'leader'),projectController.deleteProject);
router.route("/addmembers/:id").post(verifyRoles('admin', 'leader'),projectController.addMemberToProject);
router
  .route("/removemember")
  .delete(verifyRoles('admin', 'leader'),projectController.removeMemberFromProject);
router.route("/getmembers/:id").get(projectController.listMembers);
module.exports = router;
