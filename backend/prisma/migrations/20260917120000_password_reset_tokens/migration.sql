CREATE TABLE "password_reset_tokens" (
  "id" TEXT DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens" ("userId");

CREATE INDEX "password_reset_tokens_tokenHash_idx" ON "password_reset_tokens" ("tokenHash");

ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
