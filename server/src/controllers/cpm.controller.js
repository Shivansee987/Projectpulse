
const prisma = require("../config/prisma");

// CRITICAL PATH METHOD (CPM) ENGINE
exports.calculateCPM = async (req, res) => {
  try {
    const { projectId } = req.params;

    // VERIFY PROJECT OWNERSHIP
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: req.user.id,
      },
      include: {
        tasks: {
          include: {
            dependencies: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tasks = project.tasks;

    if (tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Project has no tasks to calculate",
      });
    }

    // BUILD TASK MAP
    const taskMap = new Map();

    tasks.forEach((task) => {
      taskMap.set(task.id, {
        ...task,
        ES: 0,
        EF: 0,
        LS: 0,
        LF: 0,
        slack: 0,
      });
    });

    // BUILD SUCCESSOR MAP
    const successors = new Map();

    tasks.forEach((task) => {
      successors.set(task.id, []);
    });

    tasks.forEach((task) => {
      task.dependencies.forEach((dependency) => {
        if (!taskMap.has(dependency.dependsOnTaskId)) {
          throw new Error("Invalid dependency found in project");
        }

        successors.get(dependency.dependsOnTaskId).push(task.id);
      });
    });

    // FORWARD PASS
    const completed = new Set();

    while (completed.size < tasks.length) {
      let progress = false;

      for (const task of taskMap.values()) {
        if (completed.has(task.id)) continue;

        const predecessors = task.dependencies.map(
          (dependency) => dependency.dependsOnTaskId
        );

        const allCompleted = predecessors.every(
          (id) => completed.has(id)
        );

        if (!allCompleted) continue;

        const predecessorEF = predecessors.map(
          (id) => taskMap.get(id).EF
        );

        task.ES = predecessorEF.length
          ? Math.max(...predecessorEF)
          : 0;

        task.EF = task.ES + task.duration;

        completed.add(task.id);
        progress = true;
      }

      if (!progress) {
        return res.status(400).json({
          success: false,
          message: "Circular dependency detected in project tasks",
        });
      }
    }

    // PROJECT DURATION
    const projectDuration = Math.max(
      ...Array.from(taskMap.values()).map((task) => task.EF)
    );

    // BACKWARD PASS
    const backwardCompleted = new Set();

    while (backwardCompleted.size < tasks.length) {
      let progress = false;

      for (const task of taskMap.values()) {
        if (backwardCompleted.has(task.id)) continue;

        const taskSuccessors = successors.get(task.id);

        const allSuccessorsCompleted = taskSuccessors.every(
          (id) => backwardCompleted.has(id)
        );

        if (!allSuccessorsCompleted) continue;

        if (taskSuccessors.length === 0) {
          task.LF = projectDuration;
        } else {
          task.LF = Math.min(
            ...taskSuccessors.map(
              (id) => taskMap.get(id).LS
            )
          );
        }

        task.LS = task.LF - task.duration;

        backwardCompleted.add(task.id);
        progress = true;
      }

      if (!progress) {
        return res.status(400).json({
          success: false,
          message: "Could not complete backward pass",
        });
      }
    }

    // SLACK AND CRITICAL PATH
    const results = Array.from(taskMap.values()).map((task) => {
      task.slack = task.LS - task.ES;

      return {
        taskId: task.id,
        title: task.title,
        duration: task.duration,
        ES: task.ES,
        EF: task.EF,
        LS: task.LS,
        LF: task.LF,
        slack: task.slack,
        isCritical: task.slack === 0,
      };
    });

    const criticalTasks = results.filter(
      (task) => task.isCritical
    );

    return res.status(200).json({
      success: true,
      message: "CPM calculated successfully",
      projectId,
      totalTasks: tasks.length,
      projectDuration,
      criticalPath: criticalTasks,
      tasks: results,
    });

  } catch (error) {
    console.error("CPM calculation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not calculate critical path",
    });
  }
};

