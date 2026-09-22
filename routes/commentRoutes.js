const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const verifyJWT = require("../middlewares/verifyJWT");

router.use(verifyJWT);

router.route("/create").post(commentController.createComment);
router.route("/task/:taskId").get(commentController.getCommentsByTask);
router.route("/delete/:id").delete(commentController.deleteComment);

module.exports = router;
