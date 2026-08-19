-- CreateTable
CREATE TABLE "login_attempt_windows" (
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ NOT NULL,
    "count" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "login_attempt_windows_pkey" PRIMARY KEY ("key")
);
