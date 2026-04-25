import express from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { subscriptionRoutes } from '../modules/subscription/subscription.routes';
import { protocolRoutes } from '../modules/protocol/protocol.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/protocols', protocolRoutes);

export default router;