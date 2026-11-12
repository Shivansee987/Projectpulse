
const prisma = require("../config/prisma");

// CREATE TASK
exports.createTask = async (req, res) => {
  try {
    const { title, duration, status, assignee, projectId } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isInteger(duration) ||
      duration <= 0 ||
      typeof projectId !== "string" ||
      !projectId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid title, positive duration and projectId are required",
      });
    }

    if (
      status !== undefined &&
      (typeof status !== "string" || !status.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Status must be a non-empty string",
      });
    }

    if (
      assignee !== undefined &&
      assignee !== null &&
      typeof assignee !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Assignee must be a string or null",
      });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: req.user.id,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        duration,
        status: status ? status.trim() : "Not Started",
        assignee:
          typeof assignee === "string"
            ? assignee.trim() || null
            : null,
        projectId: project.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create task",
    });
  }
};

// GET ALL TASKS FOR A PROJECT
exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (typeof projectId !== "string" || !projectId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: req.user.id,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        _count: {
          select: {
            dependencies: true,
            dependents: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch tasks",
    });
  }
};

// GET SINGLE TASK
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          is: {
            ownerId: req.user.id,
          },
        },
      },
      include: {
        dependencies: true,
        dependents: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch task",
    });
  }
};

// UPDATE TASK
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, status, assignee } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          is: {
            ownerId: req.user.id,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
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

    if (duration !== undefined) {
      if (!Number.isInteger(duration) || duration <= 0) {
        return res.status(400).json({
          success: false,
          message: "Duration must be a positive integer",
        });
      }
      data.duration = duration;
    }

    if (status !== undefined) {
      if (typeof status !== "string" || !status.trim()) {
        return res.status(400).json({
          success: false,
          message: "Status cannot be empty",
        });
      }
      data.status = status.trim();
    }

    if (assignee !== undefined) {
      if (assignee !== null && typeof assignee !== "string") {
        return res.status(400).json({
          success: false,
          message: "Assignee must be a string or null",
        });
      }

      data.assignee =
        typeof assignee === "string"
          ? assignee.trim() || null
          : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: existingTask.id,
      },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update task",
    });
  }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        project: {
          is: {
            ownerId: req.user.id,
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await prisma.$transaction([
      prisma.dependency.deleteMany({
        where: {
          OR: [
            { taskId: id },
            { dependsOnTaskId: id },
          ],
        },
      }),
      prisma.simulation.deleteMany({
        where: {
          taskId: id,
        },
      }),
      prisma.task.delete({
        where: {
          id,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete task",
    });
  }
};
