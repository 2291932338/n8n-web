ALTER TABLE "WorkflowEvent" DROP CONSTRAINT IF EXISTS "WorkflowEvent_taskId_fkey";

ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("taskId")
ON DELETE SET NULL ON UPDATE CASCADE;
