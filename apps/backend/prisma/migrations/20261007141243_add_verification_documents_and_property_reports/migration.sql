-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('NATIONAL_ID', 'PROOF_OF_OWNERSHIP');

-- CreateEnum
CREATE TYPE "VerificationDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PropertyReportReason" AS ENUM ('SCAM_OR_FRAUD', 'MISLEADING_INFORMATION', 'ALREADY_RENTED', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "document_type" "VerificationDocumentType" NOT NULL,
    "status" "VerificationDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_reports" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "reason" "PropertyReportReason" NOT NULL,
    "status" "PropertyReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_documents_userId_idx" ON "verification_documents"("userId");

-- CreateIndex
CREATE INDEX "verification_documents_status_idx" ON "verification_documents"("status");

-- CreateIndex
CREATE INDEX "property_reports_reporterId_idx" ON "property_reports"("reporterId");

-- CreateIndex
CREATE INDEX "property_reports_propertyId_idx" ON "property_reports"("propertyId");

-- CreateIndex
CREATE INDEX "property_reports_status_idx" ON "property_reports"("status");

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_reports" ADD CONSTRAINT "property_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_reports" ADD CONSTRAINT "property_reports_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
