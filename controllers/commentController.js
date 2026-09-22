const Comment = require("../models/comment");
const Task = require("../models/task");

////////////////////////////////////////////////////////// Create a new comment
const createComment = async (req, res) => {
  const { task, text } = req.body;

  try {
    if (!task || !text) {
      return res.status(400).json({ message: "Task ID and text are required!" });
    }

    const existingTask = await Task.findById(task);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found!" });
    }

    const newComment = new Comment({ task, text, author: req.user.id });
    await newComment.save();
    await newComment.populate("author", "firstName lastName email");

    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/////////////////////////////////////////////// Get all comments for a task
const getCommentsByTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const comments = await Comment.find({ task: taskId })
      .populate("author", "firstName lastName email")
      .sort("createdAt");

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////// Delete a comment
const deleteComment = async (req, res) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found!" });
    }

    const isElevated = req.user.role.some((r) => ["admin", "leader"].includes(r));
    const isAuthor = comment.author.equals(req.user.id);
    if (!isElevated && !isAuthor) {
      return res.status(403).json({ message: "Access denied" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment successfully deleted!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createComment,
  getCommentsByTask,
  deleteComment,
};
