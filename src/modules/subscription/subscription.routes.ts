import express from 'express';
import { auth } from '../../core/middlewares/auth';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { noStoreCache } from '../../core/middlewares/cacheControl';
import { subscriptionController } from './subscription.controller';
import { subscriptionValidation } from './subscription.validation';

const router = express.Router();

router.get(
  '/plans',
  subscriptionController.getPlans,
);

router.get(
  '/current',
  auth(),
  subscriptionController.getCurrentSubscription,
);

router.post(
  '/subscribe',
  auth(),
  noStoreCache,
  validateRequest(subscriptionValidation.createSubscription),
  subscriptionController.createSubscription,
);

router.patch(
  '/cancel',
  auth(),
  noStoreCache,
  validateRequest(subscriptionValidation.cancelSubscription),
  subscriptionController.cancelSubscription,
);

router.get(
  '/billing-history',
  auth(),
  validateRequest(subscriptionValidation.billingHistoryQuery),
  subscriptionController.getBillingHistory,
);

export const subscriptionRoutes = router;