import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Clock3, Gauge, ShieldAlert, Sparkles, Target } from "lucide-react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import Layout from "../components/layout/Layout";
import { projectData, statusStyles } from "../data/projectData";
import { calculateProjectSchedule, formatDate, getRiskSummary } from "../utils/scheduling";

const statusOptions = ["Not started", "In progress", "At risk", "Done"];

function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tasks, setTasks] = useState(projectData.tasks);
  const [selectedTaskId, setSelectedTaskId] = useState("task-5");
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [durationAdjustments, setDurationAdjustments] = useState(
    Object.fromEntries(projectData.tasks.map((task) => [task.id, 0]))
  );

  const baselineSchedule = useMemo(
    () => calculateProjectSchedule(tasks, projectData.projectStartDate),
    [tasks]
  );

  const simulatedTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        duration: Math.max(1, task.duration + (durationAdjustments[task.id] ?? 0)),
      })),
    [tasks, durationAdjustments]
  );

  const simulatedSchedule = useMemo(
    () => calculateProjectSchedule(simulatedTasks, projectData.projectStartDate),
    [simulatedTasks]
  );

  const selectedTask =
    simulatedSchedule.tasks.find((task) => task.id === selectedTaskId) ??
    simulatedSchedule.tasks[0] ??
    null;

  const criticalTasks = simulatedSchedule.criticalPath || [];
  const projectHealth = getRiskSummary(
    simulatedTasks,
    simulatedSchedule.projectDuration,
    projectData.deadline
  );

  const deltaDays = simulatedSchedule.projectDuration - baselineSchedule.projectDuration;
  const deltaLabel =
    deltaDays > 0
      ? `+${deltaDays} days overdue`
      : deltaDays === 0
        ? "On track"
        : `${Math.abs(deltaDays)} days ahead`;

  const deadlineDelta = Math.ceil(
    (new Date(`${projectData.deadline}T00:00:00`) - new Date(`${simulatedSchedule.projectFinishDate.toISOString().slice(0, 10)}T00:00:00`)) / 86400000
  );

  const riskMetrics = [
    {
      title: "Total Project Duration",
      value: `${simulatedSchedule.projectDuration} days`,
      delta: `${formatDate(projectData.projectStartDate)} → ${formatDate(simulatedSchedule.projectFinishDate.toISOString().slice(0, 10))}`,
      icon: Clock3,
      color: "indigo",
    },
    {
      title: "Critical Path Count",
      value: `${criticalTasks.length}`,
      delta: `${criticalTasks[0]?.title ?? "Discovery"} leads the sequence`,
      icon: Target,
      color: "cyan",
    },
    {
      title: "Tasks at Risk",
      value: `${simulatedTasks.filter((task) => task.status === "At risk").length}`,
      delta: `${projectHealth.overdue} unresolved risk flags`,
      icon: ShieldAlert,
      color: "amber",
    },
    {
      title: "Days to Deadline",
      value: `${Math.max(0, deadlineDelta)}d`,
      delta: `${deltaLabel}`,
      icon: CalendarClock,
      color: "emerald",
    },
  ];

  const progressValue = Math.min(
    100,
    (simulatedTasks.filter((task) => task.status === "Done").length / simulatedTasks.length) * 100
  );

  const workloadCards = projectData.teammates.map((member) => {
    const assigned = simulatedTasks.filter((task) => task.assignee === member.id).length;
    const utilization = Math.min(100, (member.load / member.capacity) * 100);

    return {
      ...member,
      assigned,
      utilization,
      isOverloaded: member.load > member.capacity * 0.9,
    };
  });

  const graphNodes = [
    { id: "task-1", position: { x: 30, y: 100 } },
    { id: "task-2", position: { x: 220, y: 100 } },
    { id: "task-3", position: { x: 220, y: 230 } },
    { id: "task-4", position: { x: 430, y: 230 } },
    { id: "task-5", position: { x: 610, y: 120 } },
    { id: "task-6", position: { x: 830, y: 120 } },
    { id: "task-7", position: { x: 1030, y: 230 } },
  ].map((node) => {
    const scheduledTask = simulatedSchedule.tasks.find((entry) => entry.id === node.id) ?? simulatedSchedule.tasks[0];
    const originalTask = simulatedTasks.find((entry) => entry.id === node.id) ?? simulatedTasks[0];
    const isCritical = scheduledTask?.isCritical;

    return {
      ...node,
      data: {
        label: (
          <div className={`node-card ${isCritical ? "critical" : ""}`}>
            <strong>{originalTask.title}</strong>
            <span>{originalTask.assignee}</span>
          </div>
        ),
      },
      style: {
        background: isCritical ? "rgba(99, 102, 241, 0.14)" : "rgba(15, 23, 42, 0.78)",
        border: `1px solid ${isCritical ? "rgba(99, 102, 241, 0.8)" : "rgba(148, 163, 184, 0.4)"}`,
        borderRadius: 18,
        boxShadow: isCritical
          ? "0 0 0 1px rgba(99,102,241,.3), 0 18px 46px rgba(99,102,241,.24)"
          : "0 16px 26px rgba(15,23,42,.12)",
        width: 180,
        color: "white",
        padding: 0,
      },
      draggable: false,
      selected: selectedTaskId === originalTask.id,
    };
  });

  const graphEdges = [
    { id: "e1-2", source: "task-1", target: "task-2", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e1-3", source: "task-1", target: "task-3", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e3-4", source: "task-3", target: "task-4", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e2-5", source: "task-2", target: "task-5", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e4-5", source: "task-4", target: "task-5", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e5-6", source: "task-5", target: "task-6", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e4-7", source: "task-4", target: "task-7", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: "e6-7", source: "task-6", target: "task-7", animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  ].map((edge) => ({
    ...edge,
    style: { stroke: "rgba(99, 102, 241, 0.75)", strokeWidth: 2 },
  }));

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
  };

  const handleAddTask = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newTask = {
      id: `task-${tasks.length + 1}`,
      title: form.get("title") || "New Task",
      assignee: form.get("assignee") || "AL",
      assigneeName: form.get("assigneeName") || "Alicia Lee",
      duration: Number(form.get("duration") || 3),
      deadline: form.get("deadline") || projectData.deadline,
      status: "Not started",
      dependencies: Array.from(form.getAll("prerequisites") || []),
      priority: "Medium",
    };

    setTasks((current) => [...current, newTask]);
    setSelectedTaskId(newTask.id);
    setTaskModalOpen(false);
    event.currentTarget.reset();
  };

  const handleResetSimulator = () => {
    setDurationAdjustments(Object.fromEntries(tasks.map((task) => [task.id, 0])));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "task-list":
        return (
          <div className="section-stack">
            <div className="panel-header with-actions">
              <div>
                <p className="eyebrow">Task registry</p>
                <h2>Delivery backlog</h2>
              </div>
              <button type="button" className="primary-button" onClick={() => setTaskModalOpen(true)}>
                <Sparkles size={16} />
                Add task
              </button>
            </div>

            <div className="table-panel glass-panel">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Title</th>
                    <th>Assignee</th>
                    <th>Duration</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Prereqs</th>
                  </tr>
                </thead>
                <tbody>
                  {simulatedTasks.map((task) => (
                    <tr key={task.id} onClick={() => setSelectedTaskId(task.id)}>
                      <td className="task-id">{task.id}</td>
                      <td>{task.title}</td>
                      <td>
                        <div className="assignee-badge">
                          <span>{task.assignee}</span>
                          {task.assigneeName}
                        </div>
                      </td>
                      <td>{task.duration}d</td>
                      <td>{formatDate(task.deadline)}</td>
                      <td>
                        <select
                          value={task.status}
                          className={`status-select ${statusStyles[task.status] || "status-pending"}`}
                          onChange={(event) => handleTaskStatusChange(task.id, event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="badge-row">
                          {(task.dependencies.length ? task.dependencies : ["No prereqs"]).map((dependency) => (
                            <span key={`${task.id}-${dependency}`} className="pill-badge">
                              {dependency}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "dependencies":
        return (
          <div className="section-stack">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Dependency map</p>
                <h2>Critical path graph</h2>
              </div>
            </div>

            <div className="graph-panel glass-panel">
              <ReactFlow nodes={graphNodes} edges={graphEdges} fitView nodesDraggable={false} nodesConnectable={false} panOnDrag>
                <Background color="#c7d2fe" gap={18} size={1} />
                <Controls />
              </ReactFlow>
            </div>

            <div className="detail-grid">
              <div className="glass-panel detail-card">
                <p className="eyebrow">Selected task</p>
                <h3>{selectedTask?.title}</h3>
                <div className="detail-grid-mini">
                  <span>Earliest start: {selectedTask ? selectedTask.earliestStart : 0}d</span>
                  <span>Finish: {selectedTask ? selectedTask.finish : 0}d</span>
                  <span>Slack: {selectedTask ? selectedTask.slack : 0}d</span>
                </div>
              </div>

              <div className="glass-panel detail-card">
                <p className="eyebrow">Critical path</p>
                <div className="badge-row">
                  {criticalTasks.map((task) => (
                    <span key={task.id} className="pill-badge critical">
                      {task.id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case "simulator":
        return (
          <div className="section-stack">
            <div className="panel-header with-actions">
              <div>
                <p className="eyebrow">Scenario planning</p>
                <h2>What-if delay simulator</h2>
              </div>
              <button type="button" className="secondary-button" onClick={handleResetSimulator}>
                Reset baseline
              </button>
            </div>

            <div className="simulator-panel glass-panel">
              <div className="simulator-summary">
                <div>
                  <span className="eyebrow">Current scenario</span>
                  <h3>{deltaLabel}</h3>
                </div>
                <div className="delta-pill">{deltaLabel}</div>
              </div>

              <div className="slider-grid">
                {simulatedTasks.map((task) => (
                  <div key={task.id} className="slider-row">
                    <div className="slider-copy">
                      <span>{task.id}</span>
                      <strong>{task.title}</strong>
                    </div>
                    <div className="slider-control">
                      <button type="button" onClick={() => setDurationAdjustments((prev) => ({ ...prev, [task.id]: (prev[task.id] ?? 0) - 1 }))}>−</button>
                      <input
                        type="range"
                        min={-4}
                        max={8}
                        value={durationAdjustments[task.id] ?? 0}
                        onChange={(event) =>
                          setDurationAdjustments((prev) => ({
                            ...prev,
                            [task.id]: Number(event.target.value),
                          }))
                        }
                      />
                      <button type="button" onClick={() => setDurationAdjustments((prev) => ({ ...prev, [task.id]: (prev[task.id] ?? 0) + 1 }))}>+</button>
                    </div>
                    <div className="slider-value">{task.duration}d</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "insights":
        return (
          <div className="section-stack">
            <div className="panel-header">
              <div>
                <p className="eyebrow">AI diagnostics</p>
                <h2>Risk intelligence</h2>
              </div>
            </div>

            <div className="insight-grid">
              <div className="glass-panel score-panel">
                <div className="score-header">
                  <span className="eyebrow">Health score</span>
                  <strong>{projectHealth.score}/100</strong>
                </div>
                <div className="score-ring" style={{ background: `conic-gradient(#6366f1 ${projectHealth.score}%, rgba(15,23,42,.08) 0)` }}>
                  <div>{projectHealth.level}</div>
                </div>
              </div>

              <div className="glass-panel insight-panel">
                <p className="eyebrow">Bottleneck diagnostics</p>
                <ul>
                  <li>{`Task 5 has 3 dependent tasks and is currently flagged ${selectedTask?.status ?? "At risk"}.`}</li>
                  <li>Jamal Wu and Noah Chen are carrying 42% of the critical path workload.</li>
                  <li>Schedule confidence is highest for discovery and architecture, but launch readiness is sensitive to QA delays.</li>
                </ul>
              </div>
            </div>

            <div className="recommendation-grid">
              <div className="glass-panel info-card">
                <p className="eyebrow">Recommended actions</p>
                <ul>
                  <li>Reassign 2 days of UI validation from Noah to Emma before Friday.</li>
                  <li>Escalate API contract sign-off to unblock the late Sprint milestone.</li>
                  <li>Move the launch checklist earlier by one working day to create buffer.</li>
                </ul>
              </div>

              <div className="glass-panel info-card">
                <p className="eyebrow">Workload balance</p>
                <div className="workload-list">
                  {workloadCards.map((member) => (
                    <div key={member.id} className="workload-item">
                      <div className="workload-meta">
                        <span>{member.initials}</span>
                        <div>
                          <strong>{member.name}</strong>
                          <small>{member.role}</small>
                        </div>
                      </div>
                      <div className="mini-bar"><i style={{ width: `${member.utilization}%` }} /></div>
                      <em>{member.load}/{member.capacity}h</em>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case "overview":
      default:
        return (
          <div className="section-stack">
            <div className="hero-band glass-panel">
              <div>
                <p className="eyebrow">Executive overview</p>
                <h1>{projectData.activeProject}</h1>
                <p className="subtitle">Intelligent project planning, risk analysis, and resource balancing across your delivery pipeline.</p>
              </div>
              <div className="hero-score">
                <Gauge size={18} />
                <span>{projectHealth.score}/100</span>
              </div>
            </div>

            <div className="stats-grid">
              {riskMetrics.map(({ title, value, delta, icon: Icon, color }) => (
                <div key={title} className={`metric-card ${color}`}>
                  <div className="metric-topline">
                    <span>{title}</span>
                    <Icon size={18} />
                  </div>
                  <strong>{value}</strong>
                  <small>{delta}</small>
                </div>
              ))}
            </div>

            <div className="mid-grid">
              <div className="glass-panel progress-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Progress</p>
                    <h3>Milestone completion</h3>
                  </div>
                  <span className="mini-pill">{Math.round(progressValue)}%</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${progressValue}%` }} />
                </div>
                <div className="progress-meta">
                  <span>Completed: {simulatedTasks.filter((task) => task.status === "Done").length}</span>
                  <span>Remaining: {simulatedTasks.length - simulatedTasks.filter((task) => task.status === "Done").length}</span>
                </div>
              </div>

              <div className="glass-panel insight-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Critical path</p>
                    <h3>Active sequence</h3>
                  </div>
                  <ArrowRight size={18} />
                </div>
                <div className="critical-strip">
                  {criticalTasks.length ? (
                    criticalTasks.map((task) => (
                      <span key={task.id} className="critical-chip">{task.id}</span>
                    ))
                  ) : (
                    <span className="critical-chip muted">No critical path</span>
                  )}
                </div>
              </div>
            </div>

            <div className="workload-grid">
              {workloadCards.map((member) => (
                <div key={member.id} className="glass-panel workload-card">
                  <div className="workload-header">
                    <div className="avatar-mini">{member.initials}</div>
                    <div>
                      <strong>{member.name}</strong>
                      <small>{member.role}</small>
                    </div>
                  </div>
                  <div className="workload-stats">
                    <span>{member.assigned} tasks</span>
                    <span className={member.isOverloaded ? "warning-pill" : "healthy-pill"}>
                      {member.isOverloaded ? "Over-allocated" : "Balanced"}
                    </span>
                  </div>
                  <div className="mini-bar"><i style={{ width: `${member.utilization}%` }} /></div>
                  <em>{member.load}/{member.capacity}h</em>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onTaskModalOpen={() => setTaskModalOpen(true)}
      onProjectModalOpen={() => setProjectModalOpen(true)}
    >
      <div className="page-shell">
        {renderContent()}
      </div>

      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setTaskModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Assign work</p>
                <h3>Create task</h3>
              </div>
              <button type="button" className="close-button" onClick={() => setTaskModalOpen(false)}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={handleAddTask}>
              <label>
                Title
                <input name="title" type="text" placeholder="New delivery task" required />
              </label>
              <label>
                Assignee
                <select name="assignee">
                  {projectData.teammates.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Duration (days)
                <input name="duration" type="number" min="1" max="21" defaultValue="5" required />
              </label>
              <label>
                Target deadline
                <input name="deadline" type="date" defaultValue={projectData.deadline} />
              </label>
              <label>
                Prerequisites
                <select name="prerequisites" multiple>
                  {simulatedTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.id} — {task.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setTaskModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setProjectModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Portfolio</p>
                <h3>Create project</h3>
              </div>
              <button type="button" className="close-button" onClick={() => setProjectModalOpen(false)}>
                ×
              </button>
            </div>

            <form className="modal-form">
              <label>
                Client / team name
                <input type="text" placeholder="Northstar Labs" />
              </label>
              <label>
                Start date
                <input type="date" defaultValue={projectData.projectStartDate} />
              </label>
              <label>
                Delivery target
                <input type="date" defaultValue={projectData.deadline} />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setProjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="primary-button" onClick={() => setProjectModalOpen(false)}>
                  Save project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;