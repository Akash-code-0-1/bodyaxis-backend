import { z } from 'zod';

const recommendProtocols = z.object({
  body: z.object({
    targetAreas: z.array(z.string().min(1)).min(1),
    userCase: z.string().min(1),
    durationMinutes: z.number().optional(),
    daysPerWeek: z.number().optional(),
    totalWeeks: z.number().optional(),
    limit: z.number().min(1).max(20).optional(),
  }),
});

const getProtocols = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    targetArea: z.string().optional(),
    userCase: z.string().optional(),
    durationMinutes: z.string().optional(),
  }),
});

const getProtocolById = z.object({
  params: z.object({
    id: z.string().uuid('Invalid protocol id'),
  }),
});

export const protocolValidation = {
  recommendProtocols,
  getProtocols,
  getProtocolById,
};