-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_amenities" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "amenityId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "amenities"("name");

-- CreateIndex
CREATE INDEX "property_amenities_propertyId_idx" ON "property_amenities"("propertyId");

-- CreateIndex
CREATE INDEX "property_amenities_amenityId_idx" ON "property_amenities"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "property_amenities_propertyId_amenityId_key" ON "property_amenities"("propertyId", "amenityId");

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_amenities" ADD CONSTRAINT "property_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
