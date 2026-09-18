-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "districtType" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "population" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemperatureReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "maxTempC" REAL NOT NULL,
    "minTempC" REAL NOT NULL,
    "humidityPct" REAL NOT NULL,
    "heatIndexC" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemperatureReading_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HeatAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HeatAlert_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VulnerablePopulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "elderlyCount" INTEGER NOT NULL,
    "outdoorWorkersCount" INTEGER NOT NULL,
    "childrenCount" INTEGER NOT NULL,
    "hasCoolingAccessPct" REAL NOT NULL,
    "hasWaterAccessPct" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VulnerablePopulation_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecoveryIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hospitalAdmissions" INTEGER NOT NULL,
    "workdaysLost" INTEGER NOT NULL,
    "cropLossPct" REAL NOT NULL,
    "electricityFailures" INTEGER NOT NULL,
    "waterScarcityIndex" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecoveryIndicator_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regionId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL,
    "awarenessLevel" INTEGER NOT NULL,
    "hasHeatPlan" BOOLEAN NOT NULL,
    "accessToShade" BOOLEAN NOT NULL,
    "accessToDrinkingWater" BOOLEAN NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Region_state_idx" ON "Region"("state");

-- CreateIndex
CREATE UNIQUE INDEX "Region_state_name_key" ON "Region"("state", "name");

-- CreateIndex
CREATE INDEX "TemperatureReading_regionId_timestamp_idx" ON "TemperatureReading"("regionId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TemperatureReading_regionId_timestamp_key" ON "TemperatureReading"("regionId", "timestamp");

-- CreateIndex
CREATE INDEX "HeatAlert_regionId_issuedAt_idx" ON "HeatAlert"("regionId", "issuedAt");

-- CreateIndex
CREATE INDEX "HeatAlert_regionId_active_idx" ON "HeatAlert"("regionId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "VulnerablePopulation_regionId_key" ON "VulnerablePopulation"("regionId");

-- CreateIndex
CREATE INDEX "RecoveryIndicator_regionId_date_idx" ON "RecoveryIndicator"("regionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryIndicator_regionId_date_key" ON "RecoveryIndicator"("regionId", "date");

-- CreateIndex
CREATE INDEX "SurveyResponse_regionId_submittedAt_idx" ON "SurveyResponse"("regionId", "submittedAt");
