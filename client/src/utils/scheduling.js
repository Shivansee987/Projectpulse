export function addDays(dateString, dayOffset) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

export function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function calculateProjectSchedule(tasks, projectStartDate = "2026-11-02") {
  const taskMap = new Map();
  const pendingInDegree = new Map();
  const adjacency = new Map();

  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, earliestStart: 0, finish: 0, latestStart: 0, latestFinish: 0, slack: 0, isCritical: false });
    adjacency.set(task.id, []);
    pendingInDegree.set(task.id, 0);
  });

  tasks.forEach((task) => {
    task.dependencies.forEach((dependencyId) => {
      if (!taskMap.has(dependencyId)) {
        return;
      }

      adjacency.get(dependencyId).push(task.id);
      pendingInDegree.set(task.id, pendingInDegree.get(task.id) + 1);
    });
  });

  const queue = tasks
    .filter((task) => pendingInDegree.get(task.id) === 0)
    .map((task) => task.id)
    .sort();

  const topoOrder = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    topoOrder.push(currentId);

    const neighbors = adjacency.get(currentId) || [];
    neighbors.forEach((neighborId) => {
      const nextCount = pendingInDegree.get(neighborId) - 1;
      pendingInDegree.set(neighborId, nextCount);

      if (nextCount === 0) {
        queue.push(neighborId);
        queue.sort();
      }
    });
  }

  const hasCycle = topoOrder.length !== tasks.length;

  if (hasCycle) {
    return {
      hasCycle: true,
      alert: "Cycle detected in dependency graph. Schedule recalculation paused.",
      tasks: [],
      projectDuration: 0,
      criticalPath: [],
      projectFinishDate: projectStartDate,
    };
  }

  topoOrder.forEach((taskId) => {
    const task = taskMap.get(taskId);
    const dependencyIds = tasks.find((entry) => entry.id === taskId)?.dependencies ?? [];
    const earliestStart = dependencyIds.length
      ? Math.max(...dependencyIds.map((dependencyId) => taskMap.get(dependencyId).finish))
      : 0;

    task.earliestStart = earliestStart;
    task.finish = earliestStart + task.duration;
  });

  const projectDuration = Math.max(...Array.from(taskMap.values()).map((task) => task.finish));
  const projectFinishDate = addDays(projectStartDate, projectDuration);

  for (let index = topoOrder.length - 1; index >= 0; index -= 1) {
    const taskId = topoOrder[index];
    const currentTask = taskMap.get(taskId);
    const successorIds = tasks
      .filter((task) => (task.dependencies ?? []).includes(taskId))
      .map((task) => task.id);

    const latestFinish = successorIds.length
      ? Math.min(...successorIds.map((successorId) => taskMap.get(successorId).latestStart))
      : projectDuration;

    currentTask.latestFinish = latestFinish;
    currentTask.latestStart = latestFinish - currentTask.duration;
    currentTask.slack = currentTask.latestStart - currentTask.earliestStart;
    currentTask.isCritical = currentTask.slack === 0;
  }

  const criticalPath = topoOrder
    .filter((taskId) => taskMap.get(taskId).isCritical)
    .map((taskId) => taskMap.get(taskId));

  return {
    hasCycle: false,
    alert: "",
    tasks: Array.from(taskMap.values()).sort((a, b) => a.id.localeCompare(b.id)),
    projectDuration,
    projectFinishDate,
    criticalPath,
  };
}

export function getRiskSummary(tasks, projectDuration, deadline) {
  const overdue = tasks.filter((task) => task.status === "At risk").length;
  const daysUntilDeadline = Math.max(0, Math.ceil((new Date(`${deadline}T00:00:00`) - new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)) / 86400000));
  const score = Math.min(95, 35 + overdue * 18 + Math.max(0, Math.ceil(projectDuration / 5)));

  return {
    score,
    level: score > 70 ? "High risk" : score > 45 ? "Watchlist" : "Healthy",
    overdue,
    daysUntilDeadline,
  };
}
