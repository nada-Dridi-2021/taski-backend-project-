const Project = require("../models/project");
const Task = require("../models/task");
const User = require("../models/users");

////////////////////////////////////////////////////////// Create a new project
const createProject = async (req, res) => {
  const { title, description, startDate, endDate, members } = req.body;

  try {
    const currentDate = new Date();
    let status = "not started";

    if (new Date(startDate) < currentDate) {
      status = "in progress";
    }

    const newProject = new Project({
      title,
      description,
      startDate,
      endDate,
      members,
      status,
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/////////////////////////////////////////////////////////// Add Member Function
const addMemberToProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { memberId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found!" });
    }
    if (project.members.includes(memberId)) {
      return res
        .status(400)
        .json({ message: "Member already exists in the project!" });
    }
    project.members.push(memberId);
    await project.save();

    return res.status(200).json({ message: "Member added successfully!" });
  } catch (error) {
    return res.status(500).json({ message: "Server error!" });
  }
};

const removeMemberFromProject = async (req, res) => {
  const { projectId, memberId } = req.body;

  if (!projectId || !memberId) {
    return res
      .status(400)
      .json({ message: "Project ID and Member ID are required!" });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found!" });
    }
    if (!project.members.includes(memberId)) {
      return res
        .status(400)
        .json({ message: "Member not found in the project!" });
    }
    project.members = project.members.filter(
      (member) => !member.equals(memberId)
    );
    await project.save();

    res.status(200).json({ message: "Member removed successfully!", project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

////////////////////////////////////////////////////////////// List Members Function
const listMembers = async (req, res) => {
  const projectId = req.params.id;

  try {
    const project = await Project.findById(projectId).populate("members", "-password");
    if (!project) {
      return res.status(404).json({ message: "Project not found!" });
    }

    res.status(200).json({ members: project.members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
/////////////////////////////////////////////// Get all projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("members", "-password").lean();
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

////////////////////////////////////////// Get a project by ID with tasks
const getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id).populate("members", "-password");

    if (!project) {
      return res.status(404).json({ message: "Project not found!" });
    }

    const tasks = await Task.find({ project: id });

    res.json({ project, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

////////////////////////////////////////////////////////////// Update a project
const updateProject = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedProject = await Project.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate("members", "-password");

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found!" });
    }

    res.json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////// Delete a project
const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const tasks = await Task.find({ project: id });

    if (tasks.length > 0) {
      return res.status(400).json({
        message: "Cannot delete project because it has associated tasks!",
      });
    }

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found!" });
    }

    res.json({
      message: `Project '${deletedProject.title}' successfully deleted!`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberToProject,
  removeMemberFromProject,
  listMembers,
};
