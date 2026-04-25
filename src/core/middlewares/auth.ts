import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../errors/AppError';

export type TAuthUser = {
  userId: string;
  email: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: TAuthUser;
    }
  }
}

export const auth =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization) {
        throw new AppError(401, 'Unauthorized access');
      }

      const [bearer, token] = authorization.split(' ');

      if (bearer !== 'Bearer' || !token) {
        throw new AppError(401, 'Invalid authorization format');
      }

      const decoded = verifyAccessToken(token) as TAuthUser;

      if (!decoded?.userId || !decoded?.role) {
        throw new AppError(401, 'Invalid token payload');
      }

      if (roles.length && !roles.includes(decoded.role)) {
        throw new AppError(403, 'Forbidden');
      }

      req.user = decoded;

      next();
    } catch (error) {
      next(error);
    }
  };