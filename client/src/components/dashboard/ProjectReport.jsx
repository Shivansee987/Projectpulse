
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ProjectReport({
  project,
  tasks = [],
  cpm,
  risks,
  history = [],
}) {
  const exportPDF = () => {
    if (!project) {
      alert("Please select a project first.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ProjectPulse - Project Report", 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${project.title || "Untitled"}`, 14, 32);
    doc.text(
      `Description: ${project.description || "No description"}`,
      14,
      40,
      { maxWidth: pageWidth - 28 }
    );

    doc.text(
      `Start Date: ${
        project.startDate
          ? new Date(project.startDate).toLocaleDateString()
          : "N/A"
      }`,
      14,
      52
    );

    doc.text(
      `Deadline: ${
        project.deadline
          ? new Date(project.deadline).toLocaleDateString()
          : "N/A"
      }`,
      14,
      60
    );

    const completed = tasks.filter(
      (task) =>
        ["done", "completed"].includes(
          String(task.status || "").toLowerCase()
        )
    ).length;

    const progress =
      tasks.length > 0
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    doc.setFont("helvetica", "bold");
    doc.text("Project Summary", 14, 74);

    autoTable(doc, {
      startY: 79,
      head: [["Metric", "Value"]],
      body: [
        ["Total Tasks", tasks.length],
        ["Completed Tasks", completed],
        ["Project Progress", `${progress}%`],
        ["Project Duration", `${cpm?.projectDuration ?? "N/A"} days`],
      ],
      theme: "grid",
    });

    doc.setFont("helvetica", "bold");
    doc.text("Task Details", 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 17,
      head: [["Task", "Duration", "Status", "Assignee"]],
      body: tasks.map((task) => [
        task.title || "Untitled",
        `${task.duration ?? 0} days`,
        task.status || "Not Started",
        task.assignee || "Unassigned",
      ]),
      theme: "striped",
      styles: { fontSize: 8 },
    });

    let nextY = doc.lastAutoTable.finalY + 12;

    if (nextY > 240) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Critical Path", 14, nextY);

    const criticalTasks = (cpm?.criticalPath || []).map(
      (task) => [
        task.title || "Untitled",
        `${task.duration ?? 0} days`,
        task.slack ?? 0,
      ]
    );

    autoTable(doc, {
      startY: nextY + 5,
      head: [["Task", "Duration", "Slack"]],
      body: criticalTasks.length
        ? criticalTasks
        : [["No critical path data available", "-", "-"]],
      theme: "grid",
      styles: { fontSize: 8 },
    });

    nextY = doc.lastAutoTable.finalY + 12;

    if (nextY > 240) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Risk Analysis", 14, nextY);

    const riskTasks = risks?.tasks || [];

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
    });

    nextY = doc.lastAutoTable.finalY + 12;

    if (nextY > 240) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Simulation History", 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      head: [
        ["Task", "Original Duration", "Simulated Duration", "Change"],
      ],
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
    });

    doc.save(
      `${(project.title || "Project").replace(/[^a-z0-9]/gi, "_")}_Report.pdf`
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Project Report
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Download a PDF report with project analytics.
          </p>
        </div>

        <button
          onClick={exportPDF}
          disabled={!project}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Download PDF Report
        </button>
      </div>
    </div>
  );
}

export default ProjectReport;

