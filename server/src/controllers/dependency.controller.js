
const prisma = require("../config/prisma");

// CHECK FOR CIRCULAR DEPENDENCIES
const wouldCreateCycle = async (taskId, dependsOnTaskId, projectId) => {
  const dependencies = await prisma.dependency.findMany({
    where: {
      task: {
        is: {
          projectId,
        },
      },
    },
    select: {
      taskId: true,
      dependsOnTaskId: true,
    },
  });

  // Build dependency graph
  const graph = {};

  for (const dependency of dependencies) {
    if (!graph[dependency.taskId]) {
      graph[dependency.taskId] = [];
    }

    graph[dependency.taskId].push(dependency.dependsOnTaskId);
  }

  // Search for a path back to the task
  const visited = new Set();
  const stack = [dependsOnTaskId];

  while (stack.length > 0) {
    const currentTaskId = stack.pop();

    if (currentTaskId === taskId) {
      return true;
    }

    if (visited.has(currentTaskId)) {
      continue;
    }

    visited.add(currentTaskId);

    const predecessors = graph[currentTaskId] || [];
    stack.push(...predecessors);
  }

  return false;
};

// CREATE DEPENDENCY
exports.createDependency = async (req, res) => {
  try {
    const { taskId, dependsOnTaskId } = req.body;

    if (
      typeof taskId !== "string" ||
      !taskId.trim() ||
      typeof dependsOnTaskId !== "string" ||
      !dependsOnTaskId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Both taskId and dependsOnTaskId are required",
      });
    }

    if (taskId === dependsOnTaskId) {
      return res.status(400).json({
        success: false,
        message: "A task cannot depend on itself",
      });
    }

    // Find both tasks and verify project ownership
    const tasks = await prisma.task.findMany({
      where: {
        id: {
          in: [taskId, dependsOnTaskId],
        },
        project: {
          is: {
            ownerId: req.user.id,
          },
        },
      },
    });

    if (tasks.length !== 2) {
      return res.status(404).json({
        success: false,
        message: "One or both tasks not found",
      });
    }

    // Both tasks must belong to the same project
    if (tasks[0].projectId !== tasks[1].projectId) {
      return res.status(400).json({
        success: false,
        message: "Tasks must belong to the same project",
      });
    }

    // Prevent duplicate dependency
    const existingDependency = await prisma.dependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
    });

    if (existingDependency) {
      return res.status(409).json({
        success: false,
        message: "Dependency already exists",
      });
    }

    // Prevent circular dependency
    const createsCycle = await wouldCreateCycle(
      taskId,
      dependsOnTaskId,
      tasks[0].projectId
    );

    if (createsCycle) {
      return res.status(400).json({
        success: false,
        message: "Circular dependency detected",
      });
    }

    // Create dependency
    const dependency = await prisma.dependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Dependency created successfully",
      dependency,
    });
  } catch (error) {
    console.error("Create dependency error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create dependency",
    });
  }
};

// GET DEPENDENCIES FOR A TASK
exports.getDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          is: {
            ownerId: req.user.id,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const dependencies = await prisma.dependency.findMany({
      where: {
        taskId,
      },
      include: {
        dependsOn: true,
      },
    });

    return res.status(200).json({
      success: true,
      count: dependencies.length,
      dependencies,
    });
  } catch (error) {
    console.error("Get dependencies error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch dependencies",
    });
  }
};

// DELETE DEPENDENCY
exports.deleteDependency = async (req, res) => {
  try {
    const { id } = req.params;

    const dependency = await prisma.dependency.findFirst({
      where: {
        id,
        task: {
          is: {
            project: {
              is: {
                ownerId: req.user.id,
              },
            },
          },
        },
      },
    });

    if (!dependency) {
      return res.status(404).json({
        success: false,
        message: "Dependency not found",
      });
    }

    await prisma.dependency.delete({
      where: {
        id: dependency.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Dependency deleted successfully",
    });
  } catch (error) {
    console.error("Delete dependency error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete dependency",
    });
  }
};