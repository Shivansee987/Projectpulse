
const prisma = require("../config/prisma");

// PROJECT INSIGHTS ENGINE
exports.generateProjectInsights = async (req, res) => {
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
        message: "Project has no tasks for insights",
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
          throw new Error("Invalid dependency found");
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

        if (!predecessors.every((id) => completed.has(id))) {
          continue;
        }

        task.ES = predecessors.length
          ? Math.max(...predecessors.map((id) => taskMap.get(id).EF))
          : 0;

        task.EF = task.ES + task.duration;

        completed.add(task.id);
        progress = true;
      }

      if (!progress) {
        return res.status(400).json({
          success: false,
          message: "Circular dependency detected",
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

        if (!taskSuccessors.every((id) => backwardCompleted.has(id))) {
          continue;
        }

        task.LF = taskSuccessors.length
          ? Math.min(...taskSuccessors.map((id) => taskMap.get(id).LS))
          : projectDuration;

        task.LS = task.LF - task.duration;
        task.slack = task.LS - task.ES;

        backwardCompleted.add(task.id);
        progress = true;
      }

      if (!progress) {
        return res.status(400).json({
          success: false,
          message: "Backward pass could not be completed",
        });
      }
    }

    // GENERATE PROJECT INSIGHTS
    const insights = [];

    const criticalTasks = Array.from(taskMap.values()).filter(
      (task) => task.slack === 0
    );

    const highRiskTasks = Array.from(taskMap.values()).filter(
      (task) => task.slack === 0
    );

    const delayedTasks = tasks.filter(
      (task) => task.status === "Delayed"
    );

    const completedTasks = tasks.filter(
      (task) => task.status === "Completed"
    );

    const completionPercentage = Math.round(
      (completedTasks.length / tasks.length) * 100
    );

    // CRITICAL TASK INSIGHT
    if (criticalTasks.length > 0) {
      insights.push({
        type: "Critical Path",
        priority: "High",
        message: `${criticalTasks.length} task(s) are on the critical path.`,
        recommendation:
          "Monitor these tasks closely because any delay can affect project completion.",
      });
    }

    // HIGH RISK INSIGHT
    if (highRiskTasks.length > 0) {
      insights.push({
        type: "Project Risk",
        priority: "High",
        message: `${highRiskTasks.length} task(s) have zero scheduling slack.`,
        recommendation:
          "Assign sufficient resources and track progress regularly for critical tasks.",
      });
    }

    // DELAY INSIGHT
    if (delayedTasks.length > 0) {
      insights.push({
        type: "Task Delays",
        priority: "High",
        message: `${delayedTasks.length} task(s) are marked as delayed.`,
        recommendation:
          "Review blockers and revise task schedules to reduce project delays.",
      });
    }

    // LOW SLACK INSIGHT
    const lowSlackTasks = Array.from(taskMap.values()).filter(
      (task) => task.slack > 0 && task.slack <= 2
    );

    if (lowSlackTasks.length > 0) {
      insights.push({
        type: "Low Slack",
        priority: "Medium",
        message: `${lowSlackTasks.length} task(s) have only 1–2 days of scheduling flexibility.`,
        recommendation:
          "Monitor these tasks to prevent them from becoming critical.",
      });
    }

    // PROJECT PROGRESS INSIGHT
    insights.push({
      type: "Project Progress",
      priority: "Info",
      message: `Project completion is currently ${completionPercentage}%.`,
      recommendation:
        "Update task statuses regularly to keep project progress accurate.",
    });

    // DEADLINE INSIGHT
    const deadline = new Date(project.deadline);

    const estimatedCompletionDate = new Date(project.startDate);
    estimatedCompletionDate.setDate(
      estimatedCompletionDate.getDate() + projectDuration
    );

    if (estimatedCompletionDate > deadline) {
      insights.push({
        type: "Deadline Risk",
        priority: "High",
        message: "Estimated project completion exceeds the project deadline.",
        recommendation:
          "Consider reducing task durations, adding resources, or adjusting the deadline.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project insights generated successfully",
      projectId,
      projectDuration,
      totalTasks: tasks.length,
      completionPercentage,
      estimatedCompletionDate,
      insights,
    });

  } catch (error) {
    console.error("Project insights error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not generate project insights",
    });
  }
};