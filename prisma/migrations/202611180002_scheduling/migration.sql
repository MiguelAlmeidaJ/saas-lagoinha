ALTER TABLE "Person" ADD COLUMN "userId" UUID;
CREATE UNIQUE INDEX "Person_userId_key" ON "Person"("userId");
CREATE UNIQUE INDEX "Person_churchId_id_key" ON "Person"("churchId","id");
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Ministry_churchId_id_key" ON "Ministry"("churchId","id");
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDENTE','CONFIRMADA','RECUSADA');
CREATE TABLE "TeamMember" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "ministryId" UUID NOT NULL, "personId" UUID NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MinistryFunction" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "ministryId" UUID NOT NULL, "name" VARCHAR(100) NOT NULL,
 CONSTRAINT "MinistryFunction_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ServiceEvent" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "ministryId" UUID NOT NULL, "title" VARCHAR(160) NOT NULL,
 "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL, "location" VARCHAR(160),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ServiceEvent_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "event_time_order" CHECK ("endsAt" > "startsAt")
);
CREATE TABLE "ScheduleAssignment" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "ministryId" UUID NOT NULL,
 "eventId" UUID NOT NULL, "personId" UUID NOT NULL, "functionId" UUID,
 "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDENTE',
 "respondedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ScheduleAssignment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Unavailability" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "personId" UUID NOT NULL,
 "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL, "reason" VARCHAR(250),
 CONSTRAINT "Unavailability_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "unavailability_time_order" CHECK ("endsAt" > "startsAt")
);
CREATE UNIQUE INDEX "TeamMember_churchId_ministryId_personId_key" ON "TeamMember"("churchId","ministryId","personId");
CREATE INDEX "TeamMember_churchId_personId_idx" ON "TeamMember"("churchId","personId");
CREATE UNIQUE INDEX "MinistryFunction_churchId_id_key" ON "MinistryFunction"("churchId","id");
CREATE UNIQUE INDEX "MinistryFunction_churchId_ministryId_name_key" ON "MinistryFunction"("churchId","ministryId","name");
CREATE INDEX "MinistryFunction_churchId_ministryId_idx" ON "MinistryFunction"("churchId","ministryId");
CREATE UNIQUE INDEX "ServiceEvent_churchId_id_key" ON "ServiceEvent"("churchId","id");
CREATE INDEX "ServiceEvent_churchId_startsAt_idx" ON "ServiceEvent"("churchId","startsAt");
CREATE INDEX "ServiceEvent_churchId_ministryId_idx" ON "ServiceEvent"("churchId","ministryId");
CREATE UNIQUE INDEX "ScheduleAssignment_churchId_eventId_personId_key" ON "ScheduleAssignment"("churchId","eventId","personId");
CREATE INDEX "ScheduleAssignment_churchId_personId_idx" ON "ScheduleAssignment"("churchId","personId");
CREATE INDEX "Unavailability_churchId_personId_startsAt_idx" ON "Unavailability"("churchId","personId","startsAt");
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_churchId_ministryId_fkey" FOREIGN KEY ("churchId","ministryId") REFERENCES "Ministry"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_churchId_personId_fkey" FOREIGN KEY ("churchId","personId") REFERENCES "Person"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryFunction" ADD CONSTRAINT "MinistryFunction_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MinistryFunction" ADD CONSTRAINT "MinistryFunction_churchId_ministryId_fkey" FOREIGN KEY ("churchId","ministryId") REFERENCES "Ministry"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceEvent" ADD CONSTRAINT "ServiceEvent_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceEvent" ADD CONSTRAINT "ServiceEvent_churchId_ministryId_fkey" FOREIGN KEY ("churchId","ministryId") REFERENCES "Ministry"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_churchId_ministryId_fkey" FOREIGN KEY ("churchId","ministryId") REFERENCES "Ministry"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_churchId_eventId_fkey" FOREIGN KEY ("churchId","eventId") REFERENCES "ServiceEvent"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_churchId_personId_fkey" FOREIGN KEY ("churchId","personId") REFERENCES "Person"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleAssignment" ADD CONSTRAINT "ScheduleAssignment_churchId_functionId_fkey" FOREIGN KEY ("churchId","functionId") REFERENCES "MinistryFunction"("churchId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unavailability" ADD CONSTRAINT "Unavailability_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unavailability" ADD CONSTRAINT "Unavailability_churchId_personId_fkey" FOREIGN KEY ("churchId","personId") REFERENCES "Person"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
