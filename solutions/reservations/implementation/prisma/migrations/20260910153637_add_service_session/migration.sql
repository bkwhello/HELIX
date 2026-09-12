-- CreateTable
CREATE TABLE "service_sessions" (
    "id" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "service_date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "opened_at" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "service_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_sessions_service_code_service_date_key" ON "service_sessions"("service_code", "service_date");
