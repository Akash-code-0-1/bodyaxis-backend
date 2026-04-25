import express from 'express';
import { auth } from '../../core/middlewares/auth';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { protocolController } from './protocol.controller';
import { protocolValidation } from './protocol.validation';

const router = express.Router();

router.get(
  '/',
  auth(),
  validateRequest(protocolValidation.getProtocols),
  protocolController.getProtocols,
);

router.post(
  '/recommend',
  auth(),
  validateRequest(protocolValidation.recommendProtocols),
  protocolController.recommendProtocols,
);

router.get(
  '/:id',
  auth(),
  validateRequest(protocolValidation.getProtocolById),
  protocolController.getProtocolById,
);

export const protocolRoutes = router;