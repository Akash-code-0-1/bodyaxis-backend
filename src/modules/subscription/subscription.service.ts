import crypto from 'crypto';
import { BillingCycle, PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';
import { AppError } from '../../core/errors/AppError';
import {
  TBillingHistoryQuery,
  TCreateSubscriptionPayload,
} from './subscription.interface';

type TPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type TBillingHistoryResponse = {
  meta: TPaginationMeta;
  data: unknown[];
};

const PLAN_CACHE_KEY = 'subscription:plans:active:v2';
const USER_SUBSCRIPTION_PREFIX = 'subscription:user:';
const BILLING_HISTORY_PREFIX = 'billing:user:';

const CACHE_TTL_SECONDS = 300;
const MAX_PAGE_LIMIT = 50;

const setCache = async (key: string, value: unknown, ttl = CACHE_TTL_SECONDS) => {
  await redis.set(key, JSON.stringify(value), 'EX', ttl);
};

const getCache = async <T>(key: string): Promise<T | null> => {
  const cached = await redis.get(key);
  return cached ? (JSON.parse(cached) as T) : null;
};

const deleteByPattern = async (pattern: string) => {
  const stream = redis.scanStream({
    match: pattern,
    count: 100,
  });

  const keys: string[] = [];

  for await (const resultKeys of stream) {
    keys.push(...(resultKeys as string[]));
  }

  if (keys.length) {
    await redis.del(...keys);
  }
};

const invalidateUserSubscriptionCache = async (userId: string) => {
  await redis.del(`${USER_SUBSCRIPTION_PREFIX}${userId}`);
  await deleteByPattern(`${BILLING_HISTORY_PREFIX}${userId}:*`);
};

const calculateExpiryDate = (cycle: BillingCycle) => {
  const expiresAt = new Date();

  if (cycle === 'MONTHLY') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  if (cycle === 'YEARLY') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  return expiresAt;
};

const getPagination = (query: TBillingHistoryQuery) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), MAX_PAGE_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getPlans = async () => {
  const cached = await getCache(PLAN_CACHE_KEY);

  if (cached) return cached;

  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      billingCycle: true,
      price: true,
      currency: true,
      discountPercent: true,
      features: true,
      lastUpdated: true,
    },
    orderBy: [
      {
        billingCycle: 'asc',
      },
      {
        price: 'asc',
      },
    ],
  });

  await setCache(PLAN_CACHE_KEY, plans);

  return plans;
};

const getCurrentSubscription = async (userId: string) => {
  const cacheKey = `${USER_SUBSCRIPTION_PREFIX}${userId}`;

  const cached = await getCache(cacheKey);

  if (cached) return cached;

  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      canceledAt: true,
      lastUpdated: true,
      plan: {
        select: {
          id: true,
          name: true,
          billingCycle: true,
          price: true,
          currency: true,
          features: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  await setCache(cacheKey, subscription, 120);

  return subscription;
};

const createSubscription = async (
  userId: string,
  payload: TCreateSubscriptionPayload,
) => {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      id: payload.planId,
      isActive: true,
    },
    select: {
      id: true,
      price: true,
      currency: true,
      billingCycle: true,
    },
  });

  if (!plan) {
    throw new AppError(404, 'Subscription plan not found');
  }

  const expiresAt = calculateExpiryDate(plan.billingCycle);

  const result = await prisma.$transaction(async tx => {
    await tx.userSubscription.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const subscription = await tx.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        expiresAt,
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        plan: true,
      },
    });

    const payment = await tx.paymentTransaction.create({
      data: {
        userId,
        planId: plan.id,
        subscriptionId: subscription.id,
        transactionId: `TXN-${crypto.randomUUID()}`,
        amount: plan.price,
        currency: plan.currency,
        paymentMethod: payload.paymentMethod,
        status: 'PAID',
      },
      select: {
        id: true,
        transactionId: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      subscription,
      payment,
    };
  });

  await invalidateUserSubscriptionCache(userId);

  return result;
};

const cancelSubscription = async (userId: string, subscriptionId: string) => {
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      id: subscriptionId,
      userId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });

  if (!subscription) {
    throw new AppError(404, 'Active subscription not found');
  }

  const updatedSubscription = await prisma.userSubscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      canceledAt: true,
      lastUpdated: true,
      plan: {
        select: {
          id: true,
          name: true,
          billingCycle: true,
          price: true,
          currency: true,
        },
      },
    },
  });

  await invalidateUserSubscriptionCache(userId);

  return updatedSubscription;
};

const getBillingHistory = async (
  userId: string,
  query: TBillingHistoryQuery,
): Promise<TBillingHistoryResponse> => {
  const { page, limit, skip } = getPagination(query);

  const cacheKey = `${BILLING_HISTORY_PREFIX}${userId}:page:${page}:limit:${limit}:status:${query.status || 'ALL'}:method:${query.paymentMethod || 'ALL'}`;

  const cached = await getCache<TBillingHistoryResponse>(cacheKey);

  if (cached) return cached;

  const where = {
    userId,
    ...(query.status && {
      status: query.status as PaymentStatus,
    }),
    ...(query.paymentMethod && {
      paymentMethod: query.paymentMethod as PaymentMethod,
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.paymentTransaction.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        transactionId: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        lastUpdated: true,
        plan: {
          select: {
            id: true,
            name: true,
            billingCycle: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            expiresAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.paymentTransaction.count({
      where,
    }),
  ]);

  const result: TBillingHistoryResponse = {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    data,
  };

  await setCache(cacheKey, result, 120);

  return result;
};

export const subscriptionService = {
  getPlans,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
  getBillingHistory,
};