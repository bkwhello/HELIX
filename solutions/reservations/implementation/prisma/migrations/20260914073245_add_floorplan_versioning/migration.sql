-- CreateTable
CREATE TABLE "floorplans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_version_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floorplans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floorplan_versions" (
    "id" TEXT NOT NULL,
    "floorplan_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "published_at" TIMESTAMPTZ,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floorplan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floorplan_version_resources" (
    "id" TEXT NOT NULL,
    "floorplan_version_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,

    CONSTRAINT "floorplan_version_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "floorplan_versions_floorplan_id_revision_key" ON "floorplan_versions"("floorplan_id", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "floorplan_versions_floorplan_id_id_key" ON "floorplan_versions"("floorplan_id", "id");

-- CreateIndex
CREATE INDEX "floorplan_version_resources_table_id_idx" ON "floorplan_version_resources"("table_id");

-- CreateIndex
CREATE UNIQUE INDEX "floorplan_version_resources_floorplan_version_id_table_id_key" ON "floorplan_version_resources"("floorplan_version_id", "table_id");

-- AddForeignKey
ALTER TABLE "floorplans" ADD CONSTRAINT "floorplans_id_default_version_id_fkey" FOREIGN KEY ("id", "default_version_id") REFERENCES "floorplan_versions"("floorplan_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floorplan_versions" ADD CONSTRAINT "floorplan_versions_floorplan_id_fkey" FOREIGN KEY ("floorplan_id") REFERENCES "floorplans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floorplan_version_resources" ADD CONSTRAINT "floorplan_version_resources_floorplan_version_id_fkey" FOREIGN KEY ("floorplan_version_id") REFERENCES "floorplan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floorplan_version_resources" ADD CONSTRAINT "floorplan_version_resources_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
