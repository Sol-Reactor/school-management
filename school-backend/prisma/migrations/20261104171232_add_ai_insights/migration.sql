-- CreateEnum
CREATE TYPE "AiInsightKind" AS ENUM ('PROGRESS_SUMMARY', 'RISK_EXPLANATION');

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "AiInsightKind" NOT NULL,
    "content" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "canned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiInsight_studentId_kind_createdAt_idx" ON "AiInsight"("studentId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
