import assert from "node:assert/strict";
import test from "node:test";
import { getTaskReminder } from "./deadlineReminders.js";

function task(overrides = {}) {
  return {
    id: "task-1",
    title: "Prepare report",
    status: "In Progress",
    dueDate: "2026-11-24T00:00:00.000Z",
    priority: "Medium",
    ...overrides,
  };
}

test("schedules reminders at local 9 AM and 6 PM only", () => {
  const dueTask = task();
  assert.equal(
    getTaskReminder(dueTask, new Date(2026, 10, 19, 9, 0)).timeLabel,
    "09:00"
  );
  assert.equal(
    getTaskReminder(dueTask, new Date(2026, 10, 19, 18, 0)).timeLabel,
    "18:00"
  );
  assert.equal(getTaskReminder(dueTask, new Date(2026, 10, 19, 9, 1)), null);
  assert.equal(getTaskReminder(dueTask, new Date(2026, 10, 19, 12, 0)), null);
});

test("includes the five-days-before boundary and due date, but skips outside it", () => {
  assert.equal(
    getTaskReminder(task(), new Date(2026, 10, 19, 9, 0)).remainingDays,
    5
  );
  assert.equal(
    getTaskReminder(
      task({ dueDate: "2026-11-19T00:00:00.000Z" }),
      new Date(2026, 10, 19, 18, 0)
    ).remainingDays,
    0
  );
  assert.equal(
    getTaskReminder(
      task({ dueDate: "2026-11-25T00:00:00.000Z" }),
      new Date(2026, 10, 19, 9, 0)
    ),
    null
  );
  assert.equal(
    getTaskReminder(
      task({ dueDate: "2026-11-18T00:00:00.000Z" }),
      new Date(2026, 10, 19, 9, 0)
    ),
    null
  );
});

test("skips completed tasks and includes Critical tasks", () => {
  assert.equal(
    getTaskReminder(task({ status: "Completed" }), new Date(2026, 10, 19, 9, 0)),
    null
  );

  const criticalReminder = getTaskReminder(
    task({ priority: "Critical" }),
    new Date(2026, 10, 19, 9, 0)
  );
  assert.equal(criticalReminder.priority, "Critical");
  assert.equal(criticalReminder.id, "task-1|2026-11-19|09:00");
});

test("uses a calendar-day calculation across daylight-saving boundaries", () => {
  const reminder = getTaskReminder(
    task({ dueDate: "2026-03-10T00:00:00.000Z" }),
    new Date(2026, 2, 5, 9, 0)
  );
  assert.equal(reminder.remainingDays, 5);
});
