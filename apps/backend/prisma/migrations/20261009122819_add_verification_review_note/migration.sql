-- AlterTable
ALTER TABLE "verification_documents" ADD COLUMN     "review_note" TEXT,
ALTER COLUMN "url" DROP NOT NULL;
