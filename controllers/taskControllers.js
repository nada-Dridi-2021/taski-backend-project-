const Task = require("../models/task");
const Project = require("../models/project");
const List = require("../models/list");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Download = require("../models/download");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|pdf|png|gif|txt/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("File type not allowed"));
  },
}).single("file");

const uploadFileToTask = async (req, res) => {
  const { id } = req.params;

  upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "File upload failed!" });
    }

    try {
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found!" });
      }

      const isElevated = req.user.role.some((r) => ["admin", "leader"].includes(r));
      const isAssignee = task.assignedTo.equals(req.user.id);
      if (!isElevated && !isAssignee) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (req.file) {
        const download = new Download({
          taskId: task._id,
          filePath: req.file.path,
          originalName: req.file.originalname,
          uploadedBy: req.user.id,
        });
        await download.save();

        task.attachments.push(download._id);
        await task.save();
      }

      await task.populate("attachments");
      res.json({ message: "File uploaded successfully!", task });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
};

//////////////////////////////////////////////// Get attachments for a task
const getTaskAttachments = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id).populate("attachments");
    if (!task) {
      return res.status(404).json({ message: "Task not found!" });
    }

    res.json(task.attachments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////// Delete an attachment
const deleteAttachment = async (req, res) => {
  const { id, attachmentId } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found!" });
    }

    const download = await Download.findById(attachmentId);
    if (!download) {
      return res.status(404).json({ message: "Attachment not found!" });
    }

    fs.unlink(download.filePath, (err) => {
      if (err) console.error("Failed to delete file from disk:", err);
    });

    task.attachments = task.attachments.filter(
      (a) => !a.equals(attachmentId)
    );
    await task.save();
    await download.deleteOne();

    res.json({ message: "Attachment successfully deleted!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
/////////////////////////////////////////////////////////////////////// creation task

const createTask = async (req, res) => {
  const { title, description, dueDate, project, assignedTo, priority, list, position } =
    req.body;

  try {
    if (!project) {
      return res.status(400).json({ message: "Project ID is required!" });
    }

    if (!assignedTo) {
      return res.status(400).json({ message: "Assigned user ID is required!" });
    }

    if (!list) {
      return res.status(400).json({ message: "List ID is required!" });
    }

    const existingProject = await Project.findById(project);
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found!" });
    }

    if (!existingProject.members.includes(assignedTo)) {
      return res
        .status(403)
        .json({ message: "Assigned user is not a member of the project!" });
    }

    const existingList = await List.findById(list);
    if (!existingList || existingList.project.toString() !== project) {
      return res.status(400).json({ message: "List does not belong to this project!" });
    }

    let pos = position;
    if (pos === undefined) {
      const lastTask = await Task.findOne({ list }).sort("-position");
      pos = lastTask ? lastTask.position + 1000 : 1000;
    }

    const newTask = new Task({
      title,
      description,
      dueDate,
      project,
      assignedTo,
      priority,
      list,
      position: pos,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const getTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id)
      .populate("project")
      .populate("assignedTo", "-password")
      .populate("list");

    if (!task) {
      return res.status(404).json({ message: "Task not found!" });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/////////////////////////////////////////$/////// Update a task
const updateTask = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found!" });
    }

    const isElevated = req.user.role.some((r) => ["admin", "leader"].includes(r));
    const isAssignee = task.assignedTo.equals(req.user.id);
    if (!isElevated && !isAssignee) {
      return res.status(403).json({ message: "Access denied" });
    }

    Object.assign(task, updates);
    await task.save();
    await task.populate("project");
    await task.populate("assignedTo", "-password");
    await task.populate("list");

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

///////////////////////////////////////////////////////// Delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found!" });
    }

    res.json({ message: `Task '${deletedTask.title}' successfully deleted!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTask,
  getTaskById,
  updateTask,
  uploadFileToTask,
  deleteTask,
  getTaskAttachments,
  deleteAttachment,
};
