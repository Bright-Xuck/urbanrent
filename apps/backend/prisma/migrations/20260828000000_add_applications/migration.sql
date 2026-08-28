-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ViewingRequestStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'DECLINED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewing_requests" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "status" "ViewingRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "proposed_times" JSONB,
    "confirmed_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_tenantId_idx" ON "applications"("tenantId");

-- CreateIndex
CREATE INDEX "applications_propertyId_idx" ON "applications"("propertyId");

-- CreateIndex
CREATE INDEX "applications_tenantId_propertyId_idx" ON "applications"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "viewing_requests_tenantId_idx" ON "viewing_requests"("tenantId");

-- CreateIndex
CREATE INDEX "viewing_requests_propertyId_idx" ON "viewing_requests"("propertyId");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_requests" ADD CONSTRAINT "viewing_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewing_requests" ADD CONSTRAINT "viewing_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
