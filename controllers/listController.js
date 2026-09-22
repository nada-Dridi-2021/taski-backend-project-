const List = require("../models/list");
const Project = require("../models/project");
const Task = require("../models/task");

////////////////////////////////////////////////////////// Create a new list
const createList = async (req, res) => {
  const { title, project, position } = req.body;

  try {
    if (!project) {
      return res.status(400).json({ message: "Project ID is required!" });
    }

    const existingProject = await Project.findById(project);
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found!" });
    }

    let pos = position;
    if (pos === undefined) {
      const lastList = await List.findOne({ project }).sort("-position");
      pos = lastList ? lastList.position + 1000 : 1000;
    }

    const newList = new List({ title, project, position: pos });
    await newList.save();
    res.status(201).json(newList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/////////////////////////////////////////////// Get all lists for a project
const getListsByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const lists = await List.find({ project: projectId }).sort("position");
    res.json(lists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

////////////////////////////////////////////////////////////// Update a list
const updateList = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedList = await List.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedList) {
      return res.status(404).json({ message: "List not found!" });
    }

    res.json(updatedList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////// Delete a list
const deleteList = async (req, res) => {
  const { id } = req.params;

  try {
    const taskCount = await Task.countDocuments({ list: id });
    if (taskCount > 0) {
      return res.status(400).json({
        message: "Cannot delete list because it has associated tasks!",
      });
    }

    const deletedList = await List.findByIdAndDelete(id);
    if (!deletedList) {
      return res.status(404).json({ message: "List not found!" });
    }

    res.json({
      message: `List '${deletedList.title}' successfully deleted!`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createList,
  getListsByProject,
  updateList,
  deleteList,
};
