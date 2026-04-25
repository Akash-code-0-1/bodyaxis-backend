import { NextFunction, Request, Response } from 'express';

export const noStoreCache = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};