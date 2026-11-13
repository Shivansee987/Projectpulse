
const prisma = require("../config/prisma");

// ==========================================
// WHAT-IF SIMULATION
// ==========================================

exports.simulateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { simulatedDuration } = req.body;

    // VALIDATE SIMULATED DURATION
    if (
      !Number.isInteger(simulatedDuration) ||
      simulatedDuration <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Simulated duration must be a positive integer",
      });
    }

    // FIND TASK AND VERIFY PROJECT OWNERSHIP
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          ownerId: req.user.id,
        },
      },
      include: {
        project: {
          include: {
            tasks: {
              include: {
                dependencies: true,
              },
            },
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

    const tasks = task.project.tasks;

    // BUILD TASK MAP WITH SIMULATED DURATION
    const taskMap = new Map();

    tasks.forEach((currentTask) => {
      taskMap.set(currentTask.id, {
        ...currentTask,
        duration:
          currentTask.id === taskId
            ? simulatedDuration
            : currentTask.duration,
        ES: 0,
        EF: 0,
        LS: 0,
        LF: 0,
        slack: 0,
      });
    });

    // BUILD SUCCESSOR MAP
    const successors = new Map();

    tasks.forEach((currentTask) => {
      successors.set(currentTask.id, []);
    });

    tasks.forEach((currentTask) => {
      currentTask.dependencies.forEach((dependency) => {
        successors
          .get(dependency.dependsOnTaskId)
          .push(currentTask.id);
      });
    });

    // FORWARD PASS
    const completed = new Set();

    while (completed.size < tasks.length) {
      let progress = false;

      for (const currentTask of taskMap.values()) {
        if (completed.has(currentTask.id)) continue;

        const predecessors =
          currentTask.dependencies.map(
            (dependency) => dependency.dependsOnTaskId
          );

        const allCompleted = predecessors.every(
          (id) => completed.has(id)
        );

        if (!allCompleted) continue;

        const predecessorEF = predecessors.map(
          (id) => taskMap.get(id).EF
        );

        currentTask.ES = predecessorEF.length
          ? Math.max(...predecessorEF)
          : 0;

        currentTask.EF =
          currentTask.ES + currentTask.duration;

        completed.add(currentTask.id);
        progress = true;
      }

      if (!progress) {
        return res.status(400).json({
          success: false,
          message: "Circular dependency detected",
        });
      }
    }

    // CALCULATE PROJECT DURATION
    const projectDuration = Math.max(
      ...Array.from(taskMap.values()).map(
        (currentTask) => currentTask.EF
      )
    );

    // BACKWARD PASS
    const backwardCompleted = new Set();

    while (backwardCompleted.size < tasks.length) {
      let progress = false;

      for (const currentTask of taskMap.values()) {
        if (backwardCompleted.has(currentTask.id)) continue;

        const taskSuccessors = successors.get(
          currentTask.id
        );

        const allSuccessorsCompleted =
          taskSuccessors.every(
            (id) => backwardCompleted.has(id)
          );

        if (!allSuccessorsCompleted) continue;

        if (taskSuccessors.length === 0) {
          currentTask.LF = projectDuration;
        } else {
          currentTask.LF = Math.min(
            ...taskSuccessors.map(
              (id) => taskMap.get(id).LS
            )
          );
        }

        currentTask.LS =
          currentTask.LF - currentTask.duration;

        backwardCompleted.add(currentTask.id);
        progress = true;
      }

      if (!progress) {
        return res.status(400).json({
          success: false,
          message: "Backward pass could not be completed",
        });
      }
    }

    // PREPARE SIMULATION RESULTS
    const results = Array.from(taskMap.values()).map(
      (currentTask) => {
        currentTask.slack =
          currentTask.LS - currentTask.ES;

        return {
          taskId: currentTask.id,
          title: currentTask.title,
          duration: currentTask.duration,
          ES: currentTask.ES,
          EF: currentTask.EF,
          LS: currentTask.LS,
          LF: currentTask.LF,
          slack: currentTask.slack,
          isCritical: currentTask.slack === 0,
        };
      }
    );

    const criticalTasks = results.filter(
      (currentTask) => currentTask.isCritical
    );

    // SAVE SIMULATION IN DATABASE
    const simulation = await prisma.simulation.create({
      data: {
        taskId: task.id,
        originalDuration: task.duration,
        simulatedDuration,
      },
    });

    // SEND RESPONSE
    return res.status(200).json({
      success: true,
      message: "What-if simulation completed successfully",
      simulationId: simulation.id,
      projectId: task.projectId,
      taskId: task.id,
      originalDuration: task.duration,
      simulatedDuration,
      projectDuration,
      criticalPath: criticalTasks,
      tasks: results,
    });

  } catch (error) {
    console.error("Simulation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not complete simulation",
    });
  }
};


// ==========================================
// GET SIMULATION HISTORY FOR A PROJECT
// ==========================================

exports.getProjectSimulationHistory = async (req, res) => {
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
          select: {
            id: true,
            title: true,
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

    // GET PROJECT TASK IDS
    const taskIds = project.tasks.map(
      (task) => task.id
    );

    // FETCH SAVED SIMULATIONS
    const simulations = taskIds.length
      ? await prisma.simulation.findMany({
          where: {
            taskId: {
              in: taskIds,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : [];

    // MAP TASK TITLES
    const taskMap = new Map(
      project.tasks.map((task) => [
        task.id,
        task.title,
      ])
    );

    // PREPARE HISTORY
    const history = simulations.map((simulation) => ({
      ...simulation,
      taskTitle:
        taskMap.get(simulation.taskId) || "Unknown Task",
      projectId: project.id,
      durationChange:
        simulation.simulatedDuration -
        simulation.originalDuration,
    }));

    return res.status(200).json({
      success: true,
      message: "Simulation history retrieved successfully",
      projectId: project.id,
      projectTitle: project.title,
      count: history.length,
      history,
    });

  } catch (error) {
    console.error("Simulation history error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve simulation history",
    });
  }
};