
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileText,
  Download,
  CheckCircle2,
  ListTodo,
  Clock3,
  TrendingUp,
  ShieldAlert,
  GitBranch,
  History,
  CalendarDays,
} from "lucide-react";

function ProjectReport({
  project,
  tasks = [],
  cpm,
  risks,
  history = [],
}) {
  const completed = tasks.filter((task) =>
    ["done", "completed"].includes(
      String(task.status || "").toLowerCase()
    )
  ).length;

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const riskTasks = risks?.tasks || [];
  const criticalTasks = cpm?.criticalPath || [];

  const formatDate = (value) => {
    if (!value) return "Not set";

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Not set"
      : date.toLocaleDateString();
  };

  const exportPDF = () => {
    if (!project) {
      alert("Please select a project first.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(20, 43, 74);
    doc.rect(0, 0, pageWidth, 38, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ProjectPulse", 14, 16);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("PROJECT ANALYTICS REPORT", 14, 27);

    doc.setTextColor(30, 40, 60);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(project.title || "Untitled Project", 14, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const description = doc.splitTextToSize(
      project.description || "No description available",
      pageWidth - 28
    );
    doc.text(description, 14, 59);

    const infoY = 59 + description.length * 5 + 8;

    doc.text(`Start Date: ${formatDate(project.startDate)}`, 14, infoY);
    doc.text(`Deadline: ${formatDate(project.deadline)}`, 14, infoY + 7);

    let nextY = infoY + 18;

    doc.setFont("helvetica", "bold");
    doc.text("Project Summary", 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      head: [["Metric", "Value"]],
      body: [
        ["Total Tasks", tasks.length],
        ["Completed Tasks", completed],
        ["Project Progress", `${progress}%`],
        ["Project Duration", `${cpm?.projectDuration ?? "N/A"} days`],
      ],
      theme: "grid",
      headStyles: { fillColor: [20, 43, 74] },
    });

    nextY = doc.lastAutoTable.finalY + 12;
    if (nextY > 245) {
      doc.addPage();
      nextY = 20;
    }

    doc.text("Task Details", 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      head: [["Task", "Duration", "Status", "Assignee"]],
      body: tasks.map((task) => [
        task.title || "Untitled",
        `${task.duration ?? 0} days`,
        task.status || "Not Started",
        task.assignee || "Unassigned",
      ]),
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 43, 74] },
    });

    nextY = doc.lastAutoTable.finalY + 12;
    if (nextY > 245) {
      doc.addPage();
      nextY = 20;
    }

    doc.text("Critical Path", 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      head: [["Task", "Duration", "Slack"]],
      body: criticalTasks.length
        ? criticalTasks.map((task) => [
            task.title || "Untitled",
            `${task.duration ?? 0} days`,
            task.slack ?? 0,
          ])
        : [["No critical path data available", "-", "-"]],
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 43, 74] },
    });

    nextY = doc.lastAutoTable.finalY + 12;
    if (nextY > 245) {
      doc.addPage();
      nextY = 20;
    }

    doc.text("Risk Analysis", 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      head: [["Task", "Risk Level", "Slack"]],
      body: riskTasks.length
        ? riskTasks.map((task) => [
            task.title || "Untitled",
            task.riskLevel || "Unknown",
            task.slack ?? 0,
          ])
        : [["No risk data available", "-", "-"]],
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 43, 74] },
    });

    nextY = doc.lastAutoTable.finalY + 12;
    if (nextY > 245) {
      doc.addPage();
      nextY = 20;
    }

    doc.text("Simulation History", 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      head: [[
        "Task",
        "Original Duration",
        "Simulated Duration",
        "Change",
      ]],
      body: history.length
        ? history.map((item) => [
            item.taskTitle || "Untitled",
            `${item.originalDuration} days`,
            `${item.simulatedDuration} days`,
            `${item.durationChange > 0 ? "+" : ""}${item.durationChange} days`,
          ])
        : [["No simulation history available", "-", "-", "-"]],
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 43, 74] },
    });

    doc.save(
      `${(project.title || "Project").replace(/[^a-z0-9]/gi, "_")}_Report.pdf`
    );
  };

  const metrics = [
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: ListTodo,
      color: "blue",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "green",
    },
    {
      label: "Critical Tasks",
      value: criticalTasks.length,
      icon: GitBranch,
      color: "purple",
    },
    {
      label: "Risk Items",
      value: riskTasks.length,
      icon: ShieldAlert,
      color: "orange",
    },
  ];

  return (
    <section className="project-report">
      <div className="report-header">
        <div className="report-heading">
          <div className="report-icon">
            <FileText size={22} />
          </div>

          <div>
            <p className="report-eyebrow">PROJECT INSIGHTS</p>
            <h2>Project Report</h2>
            <p className="report-description">
              Your project performance, delivery health and analytics in one place.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="report-download"
          onClick={exportPDF}
          disabled={!project}
        >
          <Download size={17} />
          Download PDF
        </button>
      </div>

      <div className="report-project-info">
        <div>
          <span className="report-label">CURRENT PROJECT</span>
          <h3>{project?.title || "No project selected"}</h3>
          <p>
            {project?.description || "Project description is not available."}
          </p>
        </div>

        <div className="report-dates">
          <div>
            <CalendarDays size={16} />
            <span>Start: {formatDate(project?.startDate)}</span>
          </div>
          <div>
            <Clock3 size={16} />
            <span>Deadline: {formatDate(project?.deadline)}</span>
          </div>
        </div>
      </div>

      <div className="report-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              className={`report-metric report-${metric.color}`}
              key={metric.label}
            >
              <div className="report-metric-icon">
                <Icon size={19} />
              </div>
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="report-progress">
        <div className="report-progress-heading">
          <div>
            <span className="report-label">DELIVERY PROGRESS</span>
            <h3>Project completion</h3>
          </div>
          <strong>{progress}%</strong>
        </div>

        <div className="report-progress-track">
          <div
            className="report-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p>
          {completed} of {tasks.length} tasks completed
        </p>
      </div>

      <div className="report-bottom-grid">
        <div className="report-info-card">
          <div className="report-small-icon purple">
            <TrendingUp size={18} />
          </div>
          <div>
            <span>Project Duration</span>
            <strong>{cpm?.projectDuration ?? "N/A"} days</strong>
          </div>
        </div>

        <div className="report-info-card">
          <div className="report-small-icon orange">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span>Risk Analysis</span>
            <strong>{riskTasks.length} risk items</strong>
          </div>
        </div>

        <div className="report-info-card">
          <div className="report-small-icon blue">
            <History size={18} />
          </div>
          <div>
            <span>Simulation Records</span>
            <strong>{history.length} records</strong>
          </div>
        </div>
      </div>

      <style>{`
        .project-report {
          margin-top: 24px;
          padding: 26px;
          border-radius: 22px;
          background: var(--panel, #ffffff);
          color: var(--text, #172033);
          border: 1px solid var(--border, #e5e7eb);
          box-shadow: var(--shadow, 0 10px 30px rgba(15,23,42,.06));
          overflow: hidden;
        }

        :root[data-theme="dark"] .project-report {
          background: #151d30;
          color: #edf2ff;
          border-color: #293750;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 18px;
          margin-bottom: 24px;
        }

        .report-heading {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .report-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: rgba(99,102,241,.12);
          color: #818cf8;
        }

        .report-eyebrow,
        .report-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #818cf8;
          margin-bottom: 5px;
        }

        .report-heading h2 {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          color: inherit;
        }

        .report-description {
          font-size: 13px;
          margin: 5px 0 0;
          color: var(--muted, #778197);
        }

        .report-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 12px;
          padding: 12px 18px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s;
        }

        .report-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(79,70,229,.3);
        }

        .report-download:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .report-project-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          padding: 20px;
          border-radius: 16px;
          background: var(--surface, #f5f7fc);
          border: 1px solid var(--border, #e5e7eb);
        }

        :root[data-theme="dark"] .report-project-info,
        :root[data-theme="dark"] .report-info-card {
          background: #101827;
          border-color: #293750;
        }

        .report-project-info h3 {
          margin: 5px 0;
          font-size: 19px;
          font-weight: 800;
          color: inherit;
        }

        .report-project-info p {
          margin: 0;
          font-size: 13px;
          color: var(--muted, #778197);
          max-width: 500px;
        }

        .report-dates {
          display: grid;
          gap: 10px;
          font-size: 12px;
          color: var(--muted, #778197);
        }

        .report-dates div {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .report-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
          margin-top: 18px;
        }

        .report-metric {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          min-width: 0;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 15px;
          background: var(--surface, #f8fafc);
        }

        :root[data-theme="dark"] .report-metric {
          background: #1b263b;
          border-color: #2c3a54;
        }

        .report-metric-icon,
        .report-small-icon {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 12px;
        }

        .report-metric span,
        .report-info-card span {
          display: block;
          font-size: 11px;
          color: var(--muted, #778197);
          margin-bottom: 5px;
        }

        .report-metric strong,
        .report-info-card strong {
          display: block;
          font-size: 21px;
          font-weight: 800;
          color: inherit;
        }

        .report-blue .report-metric-icon,
        .report-small-icon.blue {
          color: #60a5fa;
          background: rgba(59,130,246,.14);
        }

        .report-green .report-metric-icon {
          color: #34d399;
          background: rgba(16,185,129,.14);
        }

        .report-purple .report-metric-icon,
        .report-small-icon.purple {
          color: #a78bfa;
          background: rgba(139,92,246,.14);
        }

        .report-orange .report-metric-icon,
        .report-small-icon.orange {
          color: #fb923c;
          background: rgba(249,115,22,.14);
        }

        .report-progress {
          margin-top: 20px;
          padding: 20px;
          border-radius: 16px;
          background: var(--surface, #f5f7fc);
          border: 1px solid var(--border, #e5e7eb);
        }

        :root[data-theme="dark"] .report-progress {
          background: #101827;
          border-color: #293750;
        }

        .report-progress-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .report-progress-heading h3 {
          margin: 5px 0 0;
          font-size: 16px;
          font-weight: 750;
          color: inherit;
        }

        .report-progress-heading > strong {
          font-size: 26px;
          font-weight: 850;
          color: #818cf8;
        }

        .report-progress-track {
          height: 10px;
          overflow: hidden;
          border-radius: 20px;
          margin-top: 18px;
          background: var(--border, #e5e7eb);
        }

        .report-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #6366f1, #22c1a5);
          transition: width .4s ease;
        }

        .report-progress > p {
          margin: 9px 0 0;
          font-size: 12px;
          color: var(--muted, #778197);
        }

        .report-bottom-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-top: 16px;
        }

        .report-info-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 15px;
          background: var(--surface, #f8fafc);
        }

        .report-info-card strong {
          font-size: 15px;
        }

        @media (max-width: 760px) {
          .report-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .report-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .project-report {
            padding: 17px;
          }

          .report-header {
            align-items: stretch;
          }

          .report-download {
            width: 100%;
          }

          .report-metrics {
            grid-template-columns: 1fr;
          }
        }

        .project-report {
          --report-border: var(--line);
          --report-surface: var(--surface-muted);
          --report-muted: var(--text-soft);
          border-color: var(--report-border);
          border-radius: var(--radius-xl);
          background: var(--panel);
          color: var(--text);
          box-shadow: var(--card-shadow);
          transition: background-color 240ms ease, border-color 240ms ease,
            box-shadow 240ms ease;
        }

        :root[data-theme="dark"] .project-report {
          border-color: var(--report-border);
          background: var(--panel);
          color: var(--text);
        }

        .report-icon {
          border-radius: var(--radius-md);
          background: var(--color-pink);
          color: var(--color-navy);
        }

        .report-eyebrow,
        .report-label {
          color: var(--color-navy);
        }

        :root[data-theme="dark"] .report-eyebrow,
        :root[data-theme="dark"] .report-label {
          color: var(--color-pink);
        }

        .report-description,
        .report-project-info p,
        .report-dates,
        .report-metric span,
        .report-info-card span,
        .report-progress > p {
          color: var(--report-muted);
        }

        .report-download {
          min-height: 44px;
          border: 1px solid var(--color-navy);
          border-radius: var(--radius-md);
          background: var(--color-navy);
          transition: transform 220ms ease, box-shadow 220ms ease,
            background-color 220ms ease;
        }

        .report-download:hover:not(:disabled) {
          background: #1d3d64;
          box-shadow: var(--card-shadow);
          transform: translateY(-1px);
        }

        .report-download:focus-visible {
          outline: 3px solid var(--focus);
          outline-offset: 3px;
        }

        .report-project-info,
        .report-progress,
        .report-metric,
        .report-info-card {
          border-color: var(--report-border);
          border-radius: var(--radius-lg);
          background: var(--report-surface);
        }

        :root[data-theme="dark"] .report-project-info,
        :root[data-theme="dark"] .report-progress,
        :root[data-theme="dark"] .report-metric,
        :root[data-theme="dark"] .report-info-card {
          border-color: var(--report-border);
          background: var(--report-surface);
        }

        .report-metric,
        .report-info-card {
          transition: transform 240ms ease, box-shadow 240ms ease,
            border-color 240ms ease;
        }

        .report-metric:hover,
        .report-info-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--color-navy) 42%, var(--report-border));
          box-shadow: var(--card-shadow);
        }

        :root[data-theme="dark"] .report-metric:hover,
        :root[data-theme="dark"] .report-info-card:hover {
          border-color: var(--color-pink);
        }

        .report-blue .report-metric-icon,
        .report-small-icon.blue {
          color: var(--color-navy);
          background: var(--color-blue);
        }

        .report-purple .report-metric-icon,
        .report-small-icon.purple {
          color: var(--color-navy);
          background: var(--color-pink);
        }

        :root[data-theme="dark"] .report-blue .report-metric-icon,
        :root[data-theme="dark"] .report-small-icon.blue {
          color: var(--color-navy);
        }

        .report-progress-heading > strong {
          color: var(--color-navy);
        }

        :root[data-theme="dark"] .report-progress-heading > strong {
          color: var(--color-pink);
        }

        .report-progress-track {
          background: var(--report-border);
        }

        .report-progress-fill {
          background: linear-gradient(90deg, var(--color-navy), #426184, var(--color-pink));
          transition: width 300ms ease;
        }

        @media (max-width: 760px) {
          .report-project-info {
            align-items: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .project-report *,
          .project-report *::before,
          .project-report *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}

export default ProjectReport;