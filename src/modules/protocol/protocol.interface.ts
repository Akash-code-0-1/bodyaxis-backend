export type TRecommendProtocolPayload = {
  targetAreas: string[];
  userCase: string;
  durationMinutes?: number;
  daysPerWeek?: number;
  totalWeeks?: number;
  limit?: number;
};

export type TProtocolQuery = {
  page?: string;
  limit?: string;
  search?: string;
  targetArea?: string;
  userCase?: string;
  durationMinutes?: string;
};