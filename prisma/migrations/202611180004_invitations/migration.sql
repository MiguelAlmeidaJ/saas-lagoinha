CREATE TABLE "Invitation" (
 "id" UUID NOT NULL,
 "churchId" UUID NOT NULL,
 "personId" UUID NOT NULL,
 "email" VARCHAR(254) NOT NULL,
 "role" "Role" NOT NULL DEFAULT 'VOLUNTARIO',
 "tokenHash" VARCHAR(64) NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "usedAt" TIMESTAMP(3),
 "revokedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "createdById" UUID NOT NULL,
 CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_churchId_createdAt_idx" ON "Invitation"("churchId","createdAt");
CREATE INDEX "Invitation_churchId_personId_idx" ON "Invitation"("churchId","personId");
CREATE INDEX "Invitation_churchId_email_idx" ON "Invitation"("churchId","email");
CREATE UNIQUE INDEX "Invitation_open_person_key" ON "Invitation"("churchId","personId") WHERE "usedAt" IS NULL AND "revokedAt" IS NULL;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_churchId_personId_fkey" FOREIGN KEY ("churchId","personId") REFERENCES "Person"("churchId","id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
