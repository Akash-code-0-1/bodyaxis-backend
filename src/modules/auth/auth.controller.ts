import { Request, Response } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { sendResponse } from '../../core/utils/sendResponse';
import { authService } from './auth.service';

const signUp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.signUp(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Account created successfully',
    data: result,
  });
});

const signIn = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.signIn(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token generated successfully',
    data: result,
  });
});

export const authController = {
  signUp,
  signIn,
  refreshToken,
};