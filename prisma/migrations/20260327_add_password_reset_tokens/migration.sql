-- CreateTable password_reset_tokens
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex idx_password_reset_tokens_email
CREATE INDEX "idx_password_reset_tokens_email" ON "password_reset_tokens"("email");

-- CreateIndex idx_password_reset_tokens_token
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens"("token");

-- CreateIndex idx_password_reset_tokens_expiresAt
CREATE INDEX "idx_password_reset_tokens_expiresAt" ON "password_reset_tokens"("expiresAt");
