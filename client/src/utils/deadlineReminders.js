function getDateOnly(value) {
  if (typeof value !== "string") return "";

  const dateOnly = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return "";

  const parsed = new Date(`${dateOnly}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === dateOnly
    ? dateOnly
    : "";
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysRemaining(today, dueDate) {
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const [dueYear, dueMonth, dueDay] = dueDate.split("-").map(Number);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const dueUtc = Date.UTC(dueYear, dueMonth - 1, dueDay);

  return Math.round((dueUtc - todayUtc) / 86_400_000);
}

function getReminderTime(date) {
  if (date.getMinutes() !== 0 || ![9, 18].includes(date.getHours())) {
    return "";
  }

  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

export function getTaskReminder(task, now) {
  const timeLabel = getReminderTime(now);
  const dueDate = getDateOnly(task.dueDate);
  const isCompleted =
    typeof task.status === "string" &&
    task.status.trim().toLowerCase() === "completed";

  if (!timeLabel || !task.id || !task.title || !dueDate || isCompleted) {
    return null;
  }

  const today = getLocalDateKey(now);
  const remainingDays = getDaysRemaining(today, dueDate);
  if (remainingDays < 0 || remainingDays > 5) return null;

  return {
    id: `${task.id}|${today}|${timeLabel}`,
    taskTitle: task.title,
    dueDate,
    priority: task.priority || "Medium",
    remainingDays,
    timeLabel,
  };
}
