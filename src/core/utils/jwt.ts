import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export type TTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

export const createAccessToken = (payload: TTokenPayload): string => {
  const secret: Secret = env.JWT_ACCESS_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

export const createRefreshToken = (payload: TTokenPayload): string => {
  const secret: Secret = env.JWT_REFRESH_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};