-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetArea" TEXT,
    "targetRegions" TEXT[],
    "userCases" TEXT[],
    "benefit" TEXT,
    "phase" TEXT,
    "equipment" TEXT[],
    "reps" TEXT,
    "avoidIf" TEXT,
    "coachingCue" TEXT,
    "regression" TEXT,
    "progression" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocols" (
    "id" TEXT NOT NULL,
    "protocolNumber" INTEGER,
    "name" TEXT NOT NULL,
    "targetArea" TEXT NOT NULL,
    "userCase" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "totalTime" TEXT,
    "equipment" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_exercises" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "phase" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "setsReps" TEXT,
    "equipment" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE INDEX "protocols_targetArea_idx" ON "protocols"("targetArea");

-- CreateIndex
CREATE INDEX "protocols_userCase_idx" ON "protocols"("userCase");

-- CreateIndex
CREATE INDEX "protocols_durationMinutes_idx" ON "protocols"("durationMinutes");

-- CreateIndex
CREATE INDEX "protocols_isActive_idx" ON "protocols"("isActive");

-- CreateIndex
CREATE INDEX "protocol_exercises_protocolId_idx" ON "protocol_exercises"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_exercises_exerciseId_idx" ON "protocol_exercises"("exerciseId");

-- CreateIndex
CREATE INDEX "protocol_exercises_phase_idx" ON "protocol_exercises"("phase");

-- AddForeignKey
ALTER TABLE "protocol_exercises" ADD CONSTRAINT "protocol_exercises_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_exercises" ADD CONSTRAINT "protocol_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
