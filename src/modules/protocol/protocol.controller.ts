import { Request, Response } from 'express';
import { catchAsync } from '../../core/utils/catchAsync';
import { sendResponse } from '../../core/utils/sendResponse';
import { protocolService } from './protocol.service';
import { TProtocolQuery } from './protocol.interface';

const getProtocols = catchAsync(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=180');

  const result = await protocolService.getProtocols(
    req.query as unknown as TProtocolQuery,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Protocols retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const recommendProtocols = catchAsync(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'private, max-age=300');

  const result = await protocolService.recommendProtocols(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recommended protocols retrieved successfully',
    data: result,
  });
});

const getProtocolById = catchAsync(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300');

  const id = String(req.params.id);

  const result = await protocolService.getProtocolById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Protocol details retrieved successfully',
    data: result,
  });
});

export const protocolController = {
  getProtocols,
  recommendProtocols,
  getProtocolById,
};