-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PROCESSING', 'WAITING_USER_FEEDBACK', 'IMAGE_REVIEW', 'FRAME_REVIEW', 'VIDEO_GENERATING', 'VIDEO_REVIEW', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "workflowType" TEXT,
    "taskId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PROCESSING',
    "inputParams" JSONB,
    "resultPreview" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTask_taskId_key" ON "WorkflowTask"("taskId");

-- CreateIndex
CREATE INDEX "WorkflowTask_userId_idx" ON "WorkflowTask"("userId");

-- CreateIndex
CREATE INDEX "WorkflowTask_platform_idx" ON "WorkflowTask"("platform");

-- CreateIndex
CREATE INDEX "WorkflowTask_status_idx" ON "WorkflowTask"("status");

-- CreateIndex
CREATE INDEX "WorkflowTask_createdAt_idx" ON "WorkflowTask"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowEvent_taskId_idx" ON "WorkflowEvent"("taskId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_userId_idx" ON "WorkflowEvent"("userId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_action_idx" ON "WorkflowEvent"("action");

-- CreateIndex
CREATE INDEX "WorkflowEvent_createdAt_idx" ON "WorkflowEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkflowTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
