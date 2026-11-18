import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import { getTaskReminder } from "../utils/deadlineReminders";

const STORAGE_KEY = "projectpulse.deadline-reminders.v1";
const CHECK_INTERVAL_MS = 15_000;
const REFRESH_INTERVAL_MS = 60_000;
const NOTIFICATION_LIMIT = 50;

function formatDueDate(dateOnly) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(`${dateOnly}T12:00:00`));
}

function getTaskList(response) {
  const list = response.data.tasks || response.data;
  if (!Array.isArray(list)) {
    throw new Error("The task response was not a list.");
  }

  return list;
}

function readReminderStore(storageKey) {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return { sent: [], notifications: [] };

  const stored = JSON.parse(raw);
  return {
    sent: Array.isArray(stored.sent) ? stored.sent : [],
    notifications: Array.isArray(stored.notifications)
      ? stored.notifications
      : [],
  };
}

function useDeadlineReminders() {
  const [notifications, setNotifications] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [storageError, setStorageError] = useState("");
  const tasksRef = useRef([]);
  const sentRef = useRef(new Set());
  const notificationsRef = useRef([]);
  const storeReadyRef = useRef(false);
  const storageKeyRef = useRef("");
  const refreshInFlightRef = useRef(false);
  const reminderCheckRef = useRef(null);
  const taskChangesVersionRef = useRef(0);

  const refreshTasks = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    const requestVersion = taskChangesVersionRef.current;

    try {
      const projectsResponse = await api.get("/projects");
      const projects = projectsResponse.data.projects || projectsResponse.data;
      if (!Array.isArray(projects)) {
        throw new Error("The project response was not a list.");
      }

      const taskResponses = await Promise.all(
        projects.map((project) =>
          api.get("/tasks", { params: { projectId: project.id } })
        )
      );
      if (requestVersion === taskChangesVersionRef.current) {
        tasksRef.current = taskResponses.flatMap(getTaskList);
      }
      setLoadError("");
      reminderCheckRef.current?.();
    } catch (error) {
      setLoadError(
        error.response?.data?.message ||
          error.message ||
          "Could not refresh tasks for deadline reminders."
      );
    } finally {
      refreshInFlightRef.current = false;
    }
  }, []);

  const checkReminders = useCallback(() => {
    if (!storeReadyRef.current) return;

    const now = new Date();
    tasksRef.current.forEach((task) => {
      const reminder = getTaskReminder(task, now);
      if (!reminder) return;
      const key = reminder.id;
      if (sentRef.current.has(key)) return;

      sentRef.current.add(key);
      reminder.createdAt = now.toISOString();
      const nextNotifications = [
        reminder,
        ...notificationsRef.current.filter((item) => item.id !== key),
      ].slice(0, NOTIFICATION_LIMIT);
      notificationsRef.current = nextNotifications;
      setNotifications(nextNotifications);

      try {
        if (!storageKeyRef.current) {
          throw new Error("Signed-in user identity is unavailable.");
        }
        localStorage.setItem(
          storageKeyRef.current,
          JSON.stringify({
            sent: Array.from(sentRef.current),
            notifications: nextNotifications,
          })
        );
        setStorageError("");
      } catch (error) {
        console.error("Could not save deadline reminder history:", error);
        setStorageError(
          "Reminder history could not be saved; duplicate prevention may not survive a page reload."
        );
      }

      if (
        typeof window.Notification === "function" &&
        window.Notification.permission === "granted"
      ) {
        try {
          const title = reminder.priority === "Critical"
            ? `CRITICAL TASK: ${reminder.taskTitle}`
            : `Task deadline: ${reminder.taskTitle}`;
          new window.Notification(title, {
            body: `${formatDueDate(reminder.dueDate)} · ${reminder.priority} priority · ${
              reminder.remainingDays === 0
                ? "Due today"
                : `${reminder.remainingDays} day${reminder.remainingDays === 1 ? "" : "s"} left`
            }`,
          });
        } catch (error) {
          console.error("Could not display desktop deadline reminder:", error);
        }
      }
    });
  }, []);

  useEffect(() => {
    reminderCheckRef.current = checkReminders;
  }, [checkReminders]);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user || typeof user.id !== "string" || !user.id) {
        throw new Error("Signed-in user identity is unavailable.");
      }
      storageKeyRef.current = `${STORAGE_KEY}:${user.id}`;
      const stored = readReminderStore(storageKeyRef.current);
      sentRef.current = new Set(
        stored.sent.filter((item) => typeof item === "string")
      );
      notificationsRef.current = stored.notifications.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.taskTitle === "string" &&
          typeof item.dueDate === "string"
      );
      setNotifications(notificationsRef.current);
    } catch (error) {
      console.error("Could not load deadline reminder history:", error);
      setStorageError(
        "Reminder history could not be loaded; duplicate prevention may not survive a page reload."
      );
    } finally {
      storeReadyRef.current = true;
    }

    const handleTasksUpdated = (event) => {
      const detail = event.detail || {};
      taskChangesVersionRef.current += 1;
      if (detail.task && detail.task.id) {
        tasksRef.current = [
          detail.task,
          ...tasksRef.current.filter((task) => task.id !== detail.task.id),
        ];
      } else if (detail.deletedTaskId) {
        tasksRef.current = tasksRef.current.filter(
          (task) => task.id !== detail.deletedTaskId
        );
      } else if (detail.taskId && detail.status) {
        tasksRef.current = tasksRef.current.map((task) =>
          task.id === detail.taskId
            ? { ...task, status: detail.status }
            : task
        );
      }
      checkReminders();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkReminders();
        refreshTasks();
      }
    };

    refreshTasks();
    const checkTimer = window.setInterval(checkReminders, CHECK_INTERVAL_MS);
    const refreshTimer = window.setInterval(
      refreshTasks,
      REFRESH_INTERVAL_MS
    );
    window.addEventListener("projectpulse:tasks-updated", handleTasksUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(checkTimer);
      window.clearInterval(refreshTimer);
      window.removeEventListener(
        "projectpulse:tasks-updated",
        handleTasksUpdated
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkReminders, refreshTasks]);

  return { notifications, loadError, storageError };
}

export default useDeadlineReminders;
