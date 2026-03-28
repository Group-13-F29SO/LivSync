-- CreateTable security_logs
CREATE TABLE "security_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_type" VARCHAR(50) NOT NULL,
    "user_email" VARCHAR(255),
    "user_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "metadata" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_security_logs_event_type" ON "security_logs"("event_type");

-- CreateIndex
CREATE INDEX "idx_security_logs_user_email" ON "security_logs"("user_email");

-- CreateIndex
CREATE INDEX "idx_security_logs_created_at" ON "security_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_security_logs_is_read" ON "security_logs"("is_read");

-- CreateIndex
CREATE INDEX "idx_security_logs_severity" ON "security_logs"("severity");
