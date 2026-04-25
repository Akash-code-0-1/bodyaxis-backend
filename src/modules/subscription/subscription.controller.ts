import { Request, Response } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { sendResponse } from '../../core/utils/sendResponse';
import { subscriptionService } from './subscription.service';

const getPlans = catchAsync(async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300');

  const result = await subscriptionService.getPlans();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plans retrieved successfully',
    data: result,
  });
});

const getCurrentSubscription = catchAsync(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'private, max-age=120');

  const result = await subscriptionService.getCurrentSubscription(
    req.user!.userId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Current subscription retrieved successfully',
    data: result,
  });
});

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.createSubscription(
    req.user!.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Subscription activated successfully',
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.cancelSubscription(
    req.user!.userId,
    req.body.subscriptionId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription cancelled successfully',
    data: result,
  });
});

const getBillingHistory = catchAsync(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'private, max-age=120');

  const result = await subscriptionService.getBillingHistory(
    req.user!.userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Billing history retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

export const subscriptionController = {
  getPlans,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
  getBillingHistory,
};