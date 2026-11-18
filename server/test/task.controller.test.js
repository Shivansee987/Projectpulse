const assert = require("node:assert/strict");
const test = require("node:test");

const prismaPath = require.resolve("../src/config/prisma");
const prisma = {
  project: { findFirst: async () => null },
  task: {
    create: async () => null,
    findFirst: async () => null,
    update: async () => null,
  },
};

require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: prisma,
};

const controller = require("../src/controllers/task.controller");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function invoke(handler, { body = {}, params = {} } = {}) {
  const response = createResponse();
  await handler(
    { body, params, user: { id: "user-1" } },
    response
  );
  return response;
}

test("creates tasks with a valid due date, priority, and owned project", async () => {
  let projectQuery;
  let createdData;
  prisma.project.findFirst = async ({ where }) => {
    projectQuery = where;
    return { id: "project-1" };
  };
  prisma.task.create = async ({ data }) => {
    createdData = data;
    return { id: "task-1", ...data };
  };

  const response = await invoke(controller.createTask, {
    body: {
      title: "Prepare report",
      duration: 2,
      projectId: "project-1",
      dueDate: "2026-11-24",
      priority: "Critical",
    },
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(projectQuery, { id: "project-1", ownerId: "user-1" });
  assert.equal(createdData.dueDate.toISOString(), "2026-11-24T00:00:00.000Z");
  assert.equal(createdData.priority, "Critical");
});

test("keeps legacy task creation valid with no due date and default priority", async () => {
  let createdData;
  prisma.project.findFirst = async () => ({ id: "project-1" });
  prisma.task.create = async ({ data }) => {
    createdData = data;
    return { id: "task-1", ...data };
  };

  const response = await invoke(controller.createTask, {
    body: {
      title: "Legacy task",
      duration: 1,
      projectId: "project-1",
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(createdData.dueDate, null);
  assert.equal(createdData.priority, "Medium");
});

test("rejects invalid calendar dates and unsupported priorities", async () => {
  let projectLookups = 0;
  prisma.project.findFirst = async () => {
    projectLookups += 1;
    return { id: "project-1" };
  };

  let response = await invoke(controller.createTask, {
    body: {
      title: "Invalid date",
      duration: 1,
      projectId: "project-1",
      dueDate: "2026-02-31",
    },
  });
  assert.equal(response.statusCode, 400);

  response = await invoke(controller.createTask, {
    body: {
      title: "Invalid priority",
      duration: 1,
      projectId: "project-1",
      priority: "Urgent",
    },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(projectLookups, 0);
});

test("updates status and supports clearing due dates without losing task ownership", async () => {
  let updateData;
  prisma.task.findFirst = async ({ where }) => {
    assert.deepEqual(where, {
      id: "task-1",
      project: { is: { ownerId: "user-1" } },
    });
    return { id: "task-1" };
  };
  prisma.task.update = async ({ data }) => {
    updateData = data;
    return { id: "task-1", ...data };
  };

  const response = await invoke(controller.updateTask, {
    params: { id: "task-1" },
    body: { status: "Completed", dueDate: null, priority: "Low" },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(updateData, {
    status: "Completed",
    dueDate: null,
    priority: "Low",
  });
});
