import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { redis } from "../../config/redis";
import { AppError } from "../../core/errors/AppError";
import {
  TProtocolQuery,
  TRecommendProtocolPayload,
} from "./protocol.interface";

type TPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type TProtocolListResponse = {
  meta: TPaginationMeta;
  data: unknown[];
};

const CACHE_TTL = 300;
const MAX_LIMIT = 50;
const RECOMMENDATION_CANDIDATE_LIMIT = 250;

const PROTOCOL_CACHE_PREFIX = "protocol:";
const PROTOCOL_LIST_CACHE_PREFIX = "protocol:list:";
const PROTOCOL_RECOMMEND_CACHE_PREFIX = "protocol:recommend:";

const normalize = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, " ");

const setCache = async (key: string, value: unknown, ttl = CACHE_TTL) => {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
};

const getCache = async <T>(key: string): Promise<T | null> => {
  const cached = await redis.get(key);
  return cached ? (JSON.parse(cached) as T) : null;
};

const makeCacheKey = (prefix: string, payload: unknown) => {
  return `${prefix}${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
};

const getPagination = (query: TProtocolQuery) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const calculateScore = (
  protocol: {
    targetArea: string;
    userCase: string;
    durationMinutes: number;
    equipment: string[];
    exercises?: unknown[];
  },
  payload: TRecommendProtocolPayload,
) => {
  let score = 0;
  const reasons: string[] = [];

  const protocolArea = normalize(protocol.targetArea);
  const protocolUserCase = normalize(protocol.userCase);
  const selectedAreas = payload.targetAreas.map(normalize);
  const selectedCase = normalize(payload.userCase);

  const exactAreaMatch = selectedAreas.includes(protocolArea);
  const partialAreaMatch = selectedAreas.some(
    (area) => protocolArea.includes(area) || area.includes(protocolArea),
  );

  if (exactAreaMatch) {
    score += 60;
    reasons.push("Matches selected body area");
  } else if (partialAreaMatch) {
    score += 35;
    reasons.push("Closely matches selected body area");
  }

  if (protocolUserCase === selectedCase) {
    score += 45;
    reasons.push("Matches selected condition");
  } else if (
    protocolUserCase.includes(selectedCase) ||
    selectedCase.includes(protocolUserCase)
  ) {
    score += 25;
    reasons.push("Closely matches selected condition");
  }

  if (payload.durationMinutes) {
    const durationDiff = Math.abs(
      protocol.durationMinutes - payload.durationMinutes,
    );

    if (durationDiff === 0) {
      score += 35;
      reasons.push("Matches preferred duration");
    } else if (durationDiff <= 15) {
      score += 15;
      reasons.push("Close to preferred duration");
    }
  }

  if (protocol.exercises?.length) {
    score += Math.min(protocol.exercises.length, 8);
  }

  return {
    score,
    reasons,
  };
};

const getProtocols = async (
  query: TProtocolQuery,
): Promise<TProtocolListResponse> => {
  const { page, limit, skip } = getPagination(query);

  const cacheKey = makeCacheKey(PROTOCOL_LIST_CACHE_PREFIX, {
    page,
    limit,
    search: query.search || "",
    targetArea: query.targetArea || "",
    userCase: query.userCase || "",
    durationMinutes: query.durationMinutes || "",
  });

  const cached = await getCache<TProtocolListResponse>(cacheKey);
  if (cached) return cached;

  const where: Prisma.ProtocolWhereInput = {
    isActive: true,
    ...(query.targetArea && {
      targetArea: {
        contains: query.targetArea,
        mode: "insensitive",
      },
    }),
    ...(query.userCase && {
      userCase: {
        contains: query.userCase,
        mode: "insensitive",
      },
    }),
    ...(query.durationMinutes && {
      durationMinutes: Number(query.durationMinutes),
    }),
    ...(query.search && {
      OR: [
        {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          targetArea: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          userCase: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.protocol.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        protocolNumber: true,
        name: true,
        targetArea: true,
        userCase: true,
        durationMinutes: true,
        totalTime: true,
        equipment: true,
        lastUpdated: true,
        _count: {
          select: {
            exercises: true,
          },
        },
      },
      orderBy: [
        {
          durationMinutes: "asc",
        },
        {
          protocolNumber: "asc",
        },
      ],
    }),
    prisma.protocol.count({ where }),
  ]);

  const result = {
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

  await setCache(cacheKey, result, 180);

  return result;
};

const recommendProtocols = async (payload: TRecommendProtocolPayload) => {
  const limit = Math.min(payload.limit || 5, 20);

  const cacheKey = makeCacheKey(PROTOCOL_RECOMMEND_CACHE_PREFIX, {
    ...payload,
    limit,
  });

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const durationRange = payload.durationMinutes
    ? [
        payload.durationMinutes,
        payload.durationMinutes - 15,
        payload.durationMinutes + 15,
      ].filter((value) => value > 0)
    : undefined;

  const where: Prisma.ProtocolWhereInput = {
    isActive: true,
    OR: [
      ...payload.targetAreas.map((area) => ({
        targetArea: {
          contains: area,
          mode: Prisma.QueryMode.insensitive,
        },
      })),
      {
        userCase: {
          contains: payload.userCase,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      ...(durationRange
        ? [
            {
              durationMinutes: {
                in: durationRange,
              },
            },
          ]
        : []),
    ],
  };

  const candidates = await prisma.protocol.findMany({
    where,
    take: RECOMMENDATION_CANDIDATE_LIMIT,
    select: {
      id: true,
      protocolNumber: true,
      name: true,
      targetArea: true,
      userCase: true,
      durationMinutes: true,
      totalTime: true,
      equipment: true,
      lastUpdated: true,
      exercises: {
        select: {
          id: true,
          phase: true,
          order: true,
          name: true,
          setsReps: true,
          equipment: true,
          exercise: {
            select: {
              id: true,
              name: true,
              targetArea: true,
              targetRegions: true,
              userCases: true,
              benefit: true,
              equipment: true,
              reps: true,
              avoidIf: true,
              regression: true,
              progression: true,
            },
          },
        },
        orderBy: [
          {
            phase: "asc",
          },
          {
            order: "asc",
          },
        ],
      },
    },
    orderBy: [
      {
        durationMinutes: "asc",
      },
      {
        protocolNumber: "asc",
      },
    ],
  });

  const scored = candidates
    .map((protocol) => {
      const { score, reasons } = calculateScore(protocol, payload);

      return {
        ...protocol,
        score,
        matchReasons: reasons,
      };
    })
    .filter((protocol) => protocol.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const result = {
    input: payload,
    totalCandidates: candidates.length,
    data: scored,
  };

  await setCache(cacheKey, result, 300);

  return result;
};

const getProtocolById = async (id: string) => {
  const cacheKey = `${PROTOCOL_CACHE_PREFIX}${id}`;

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const protocol = await prisma.protocol.findFirst({
    where: {
      id,
      isActive: true,
    },
    select: {
      id: true,
      protocolNumber: true,
      name: true,
      targetArea: true,
      userCase: true,
      durationMinutes: true,
      totalTime: true,
      equipment: true,
      lastUpdated: true,
      exercises: {
        select: {
          id: true,
          phase: true,
          order: true,
          name: true,
          setsReps: true,
          equipment: true,
          exercise: {
            select: {
              id: true,
              name: true,
              targetArea: true,
              targetRegions: true,
              userCases: true,
              benefit: true,
              phase: true,
              equipment: true,
              reps: true,
              avoidIf: true,
              coachingCue: true,
              regression: true,
              progression: true,
            },
          },
        },
        orderBy: [
          {
            phase: "asc",
          },
          {
            order: "asc",
          },
        ],
      },
    },
  });

  if (!protocol) {
    throw new AppError(404, "Protocol not found");
  }

  const groupedExercises = protocol.exercises.reduce(
    (acc, item) => {
      if (!acc[item.phase]) {
        acc[item.phase] = [];
      }

      acc[item.phase].push(item);
      return acc;
    },
    {} as Record<string, typeof protocol.exercises>,
  );

  const result = {
    ...protocol,
    groupedExercises,
  };

  await setCache(cacheKey, result, 300);

  return result;
};

export const protocolService = {
  getProtocols,
  recommendProtocols,
  getProtocolById,
};
