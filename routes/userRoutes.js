const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const verifyJWT = require("../middlewares/verifyJWT");
const { verifyRoles } = require("../middlewares/verifyRoles");

router.use(verifyJWT);

router.route("/all").get(verifyRoles("admin"), userController.getUsers);
router.route("/:id").get(userController.getUserById);
router
  .route("/update/:id")
  .put(verifyRoles("admin"), userController.updateUser);
router
  .route("/delete/:id")
  .delete(verifyRoles("admin"), userController.deleteUser);
router.route("/search/:query").get(userController.searchUser);

module.exports = router;
