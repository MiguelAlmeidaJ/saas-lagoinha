CREATE TABLE "LoginThrottle" (
 "emailHash" VARCHAR(64) NOT NULL,
 "failures" INTEGER NOT NULL DEFAULT 0,
 "lockedUntil" TIMESTAMP(3),
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("emailHash")
);
CREATE TABLE "PasswordReset" (
 "id" UUID NOT NULL,
 "churchId" UUID NOT NULL,
 "userId" UUID NOT NULL,
 "tokenHash" VARCHAR(64) NOT NULL,
 "createdById" UUID NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "usedAt" TIMESTAMP(3),
 "revokedAt" TIMESTAMP(3),
 CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");
CREATE INDEX "PasswordReset_churchId_userId_idx" ON "PasswordReset"("churchId","userId");
CREATE INDEX "PasswordReset_churchId_createdAt_idx" ON "PasswordReset"("churchId","createdAt");
CREATE UNIQUE INDEX "PasswordReset_open_user_key" ON "PasswordReset"("churchId","userId") WHERE "usedAt" IS NULL AND "revokedAt" IS NULL;
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
