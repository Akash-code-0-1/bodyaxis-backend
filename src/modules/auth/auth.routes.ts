import express from 'express';
import { authController } from './auth.controller';
import { authValidation } from './auth.validation';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { noStoreCache } from '../../core/middlewares/cacheControl';

const router = express.Router();

router.post(
  '/signup',
  noStoreCache,
  validateRequest(authValidation.signUp),
  authController.signUp,
);

router.post(
  '/signin',
  noStoreCache,
  validateRequest(authValidation.signIn),
  authController.signIn,
);

router.post(
  '/refresh-token',
  noStoreCache,
  validateRequest(authValidation.refreshToken),
  authController.refreshToken,
);

export const authRoutes = router;