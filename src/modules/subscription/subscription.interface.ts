export type TCreateSubscriptionPayload = {
  planId: string;
  paymentMethod: 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL' | 'CARD';
};

export type TBillingHistoryQuery = {
  page?: string;
  limit?: string;
  status?: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod?: 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL' | 'CARD';
};