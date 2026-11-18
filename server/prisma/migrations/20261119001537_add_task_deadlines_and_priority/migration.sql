CREATE TYPE "TaskPriority" AS ENUM ('Critical', 'High', 'Medium', 'Low');

ALTER TABLE "Task"
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'Medium';
