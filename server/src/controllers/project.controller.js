
const prisma = require("../config/prisma");

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const { title, description, startDate, deadline } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !startDate ||
      !deadline
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, start date and deadline are required",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedDeadline = new Date(deadline);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedDeadline.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid dates",
      });
    }

    if (parsedDeadline < parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before start date",
      });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description:
          typeof description === "string"
            ? description.trim() || null
            : null,
        startDate: parsedStartDate,
        deadline: parsedDeadline,
        ownerId: req.user.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create project",
    });
  }
};

// GET ALL PROJECTS
exports.getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        ownerId: req.user.id,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch projects",
    });
  }
};

// GET SINGLE PROJECT
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
      include: {
        tasks: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch project",
    });
  }
};

// UPDATE PROJECT
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, deadline } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const data = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      data.title = title.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string or null",
        });
      }
      data.description =
        typeof description === "string"
          ? description.trim() || null
          : null;
    }

    if (startDate !== undefined) {
      const parsed = new Date(startDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }
      data.startDate = parsed;
    }

    if (deadline !== undefined) {
      const parsed = new Date(deadline);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid deadline",
        });
      }
      data.deadline = parsed;
    }

    const finalStartDate = data.startDate || existingProject.startDate;
    const finalDeadline = data.deadline || existingProject.deadline;

    if (finalDeadline < finalStartDate) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before start date",
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update project",
    });
  }
};

// DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete project",
    });
  }
};
