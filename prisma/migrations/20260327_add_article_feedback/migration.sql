-- AlterTable: Add feedback columns to articles
ALTER TABLE "articles" ADD COLUMN "helpful_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "articles" ADD COLUMN "unhelpful_count" INTEGER NOT NULL DEFAULT 0;

-- Create article_feedback table
CREATE TABLE "article_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "article_id" INTEGER NOT NULL,
    "patient_id" UUID NOT NULL,
    "feedback" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_feedback_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "idx_article_feedback_article_id" ON "article_feedback"("article_id");
CREATE INDEX "idx_article_feedback_patient_id" ON "article_feedback"("patient_id");
CREATE INDEX "idx_article_feedback_created_at" ON "article_feedback"("created_at");
CREATE INDEX "idx_articles_helpful_count" ON "articles"("helpful_count");

-- Create unique constraint
CREATE UNIQUE INDEX "unique_article_patient_feedback" ON "article_feedback"("article_id", "patient_id");

-- Add foreign keys
ALTER TABLE "article_feedback" ADD CONSTRAINT "article_feedback_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "article_feedback" ADD CONSTRAINT "article_feedback_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
