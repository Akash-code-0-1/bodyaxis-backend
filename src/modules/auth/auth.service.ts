import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';
import { AppError } from '../../core/errors/AppError';
import {
  createAccessToken,
  createRefreshToken,
  TTokenPayload,
  verifyRefreshToken,
} from '../../core/utils/jwt';
import {
  TRefreshTokenPayload,
  TSignInPayload,
  TSignUpPayload,
} from './auth.interface';

const USER_CACHE_PREFIX = 'user:';

const sanitizeUser = <T extends { password?: string }>(user: T) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const invalidateUserCache = async (userId: string, email: string) => {
  await redis.del(
    `${USER_CACHE_PREFIX}${userId}`,
    `${USER_CACHE_PREFIX}email:${email}`,
  );
};

const signUp = async (payload: TSignUpPayload) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new AppError(409, 'Email already exists');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
      gender: payload.gender,
    },
  });

  await invalidateUserCache(user.id, user.email);

  const tokenPayload: TTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: createAccessToken(tokenPayload),
    refreshToken: createRefreshToken(tokenPayload),
    user: sanitizeUser(user),
  };
};

const signIn = async (payload: TSignInPayload) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'Your account is not active');
  }

  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(401, 'Invalid credentials');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  await invalidateUserCache(updatedUser.id, updatedUser.email);

  const tokenPayload: TTokenPayload = {
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
  };

  return {
    accessToken: createAccessToken(tokenPayload),
    refreshToken: createRefreshToken(tokenPayload),
    user: sanitizeUser(updatedUser),
  };
};

const refreshToken = async (payload: TRefreshTokenPayload) => {
  let decoded: any;

  try {
    decoded = verifyRefreshToken(payload.refreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  if (!decoded?.userId) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    throw new AppError(401, 'User not found');
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'Your account is not active');
  }

  const tokenPayload: TTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: createAccessToken(tokenPayload),
  };
};

export const authService = {
  signUp,
  signIn,
  refreshToken,
};