CREATE TYPE "SwapRequestStatus" AS ENUM ('PENDENTE','APROVADA','RECUSADA','CANCELADA');
CREATE UNIQUE INDEX "ScheduleAssignment_churchId_id_key" ON "ScheduleAssignment"("churchId","id");
CREATE TABLE "MinistryCoordinator" (
 "id" UUID NOT NULL,
 "churchId" UUID NOT NULL,
 "ministryId" UUID NOT NULL,
 "userId" UUID NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MinistryCoordinator_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SwapRequest" (
 "id" UUID NOT NULL,
 "churchId" UUID NOT NULL,
 "ministryId" UUID NOT NULL,
 "assignmentId" UUID NOT NULL,
 "requesterId" UUID NOT NULL,
 "reason" VARCHAR(500),
 "status" "SwapRequestStatus" NOT NULL DEFAULT 'PENDENTE',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "resolvedAt" TIMESTAMP(3),
 "resolvedById" UUID,
 CONSTRAINT "SwapRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MinistryCoordinator_churchId_ministryId_userId_key" ON "MinistryCoordinator"("churchId","ministryId","userId");
CREATE INDEX "MinistryCoordinator_churchId_userId_idx" ON "MinistryCoordinator"("churchId","userId");
CREATE INDEX "SwapRequest_churchId_ministryId_status_idx" ON "SwapRequest"("churchId","ministryId","status");
CREATE INDEX "SwapRequest_churchId_requesterId_idx" ON "SwapRequest"("churchId","requesterId");
CREATE UNIQUE INDEX "SwapRequest_open_assignment_key" ON "SwapRequest"("churchId","assignmentId") WHERE "status" = 'PENDENTE';
ALTER TABLE "MinistryCoordinator" ADD CONSTRAINT "MinistryCoordinator_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryCoordinator" ADD CONSTRAINT "MinistryCoordinator_churchId_ministryId_fkey" FOREIGN KEY ("churchId","ministryId") REFERENCES "Ministry"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryCoordinator" ADD CONSTRAINT "MinistryCoordinator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_churchId_ministryId_fkey" FOREIGN KEY ("churchId","ministryId") REFERENCES "Ministry"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_churchId_assignmentId_fkey" FOREIGN KEY ("churchId","assignmentId") REFERENCES "ScheduleAssignment"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
