-- CreateIndex
CREATE INDEX "protocol_exercises_protocolId_phase_order_idx" ON "protocol_exercises"("protocolId", "phase", "order");

-- CreateIndex
CREATE INDEX "protocols_targetArea_userCase_durationMinutes_isActive_idx" ON "protocols"("targetArea", "userCase", "durationMinutes", "isActive");
