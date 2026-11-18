CREATE TYPE "GrowthAttendanceStatus" AS ENUM ('PRESENTE','AUSENTE','JUSTIFICADO');

CREATE TABLE "GrowthGroup" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "name" VARCHAR(120) NOT NULL,
 "leaderId" UUID NOT NULL, "location" VARCHAR(160),
 "meetingDay" INTEGER NOT NULL, "meetingTime" VARCHAR(5) NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GrowthGroup_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "GrowthGroup_meetingDay_check" CHECK ("meetingDay" BETWEEN 0 AND 6),
 CONSTRAINT "GrowthGroup_meetingTime_check" CHECK ("meetingTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);
CREATE TABLE "GrowthGroupMember" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "groupId" UUID NOT NULL,
 "personId" UUID NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
 "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GrowthGroupMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GrowthMeeting" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "groupId" UUID NOT NULL,
 "startsAt" TIMESTAMP(3) NOT NULL, "theme" VARCHAR(160),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GrowthMeeting_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GrowthAttendance" (
 "id" UUID NOT NULL, "churchId" UUID NOT NULL, "meetingId" UUID NOT NULL,
 "memberId" UUID NOT NULL, "status" "GrowthAttendanceStatus" NOT NULL,
 "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "GrowthAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrowthGroup_churchId_id_key" ON "GrowthGroup" ("churchId","id");
CREATE UNIQUE INDEX "GrowthGroup_churchId_name_key" ON "GrowthGroup" ("churchId","name");
CREATE INDEX "GrowthGroup_churchId_leaderId_idx" ON "GrowthGroup" ("churchId","leaderId");
CREATE UNIQUE INDEX "GrowthGroupMember_churchId_id_key" ON "GrowthGroupMember" ("churchId","id");
CREATE UNIQUE INDEX "GrowthGroupMember_churchId_groupId_personId_key" ON "GrowthGroupMember" ("churchId","groupId","personId");
CREATE INDEX "GrowthGroupMember_churchId_personId_idx" ON "GrowthGroupMember" ("churchId","personId");
CREATE UNIQUE INDEX "GrowthMeeting_churchId_id_key" ON "GrowthMeeting" ("churchId","id");
CREATE UNIQUE INDEX "GrowthMeeting_churchId_groupId_startsAt_key" ON "GrowthMeeting" ("churchId","groupId","startsAt");
CREATE INDEX "GrowthMeeting_churchId_startsAt_idx" ON "GrowthMeeting" ("churchId","startsAt");
CREATE UNIQUE INDEX "GrowthAttendance_churchId_meetingId_memberId_key" ON "GrowthAttendance" ("churchId","meetingId","memberId");
CREATE INDEX "GrowthAttendance_churchId_memberId_idx" ON "GrowthAttendance" ("churchId","memberId");

ALTER TABLE "GrowthGroup" ADD CONSTRAINT "GrowthGroup_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthGroup" ADD CONSTRAINT "GrowthGroup_churchId_leaderId_fkey" FOREIGN KEY ("churchId","leaderId") REFERENCES "Person"("churchId","id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GrowthGroupMember" ADD CONSTRAINT "GrowthGroupMember_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthGroupMember" ADD CONSTRAINT "GrowthGroupMember_churchId_groupId_fkey" FOREIGN KEY ("churchId","groupId") REFERENCES "GrowthGroup"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthGroupMember" ADD CONSTRAINT "GrowthGroupMember_churchId_personId_fkey" FOREIGN KEY ("churchId","personId") REFERENCES "Person"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthMeeting" ADD CONSTRAINT "GrowthMeeting_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthMeeting" ADD CONSTRAINT "GrowthMeeting_churchId_groupId_fkey" FOREIGN KEY ("churchId","groupId") REFERENCES "GrowthGroup"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthAttendance" ADD CONSTRAINT "GrowthAttendance_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthAttendance" ADD CONSTRAINT "GrowthAttendance_churchId_meetingId_fkey" FOREIGN KEY ("churchId","meetingId") REFERENCES "GrowthMeeting"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthAttendance" ADD CONSTRAINT "GrowthAttendance_churchId_memberId_fkey" FOREIGN KEY ("churchId","memberId") REFERENCES "GrowthGroupMember"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
