ALTER TABLE "users"
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "google_id" TEXT;

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
