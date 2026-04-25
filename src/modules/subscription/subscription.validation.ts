import { z } from 'zod';

const createSubscription = z.object({
  body: z.object({
    planId: z.string().uuid('Invalid plan id'),
    paymentMethod: z.enum(['APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL', 'CARD']),
  }),
});

const cancelSubscription = z.object({
  body: z.object({
    subscriptionId: z.string().uuid('Invalid subscription id'),
  }),
});

const billingHistoryQuery = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'PAID', 'FAILED']).optional(),
    paymentMethod: z.enum(['APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL', 'CARD']).optional(),
  }),
});

export const subscriptionValidation = {
  createSubscription,
  cancelSubscription,
  billingHistoryQuery,
};