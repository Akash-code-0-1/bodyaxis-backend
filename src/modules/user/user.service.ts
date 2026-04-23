import { prisma } from "../../config/prisma";
import { getCache, setCache, deleteCache } from "../../core/utils/cache";

const getAllUsers = async () => {
  const cacheKey = "users:all";

  const cachedUsers = await getCache(cacheKey);
  if (cachedUsers) {
    return cachedUsers;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await setCache(cacheKey, users, 120);

  return users;
};

const getSingleUser = async (id: string) => {
  const cacheKey = `user:${id}`;

  const cachedUser = await getCache(cacheKey);
  if (cachedUser) {
    return cachedUser;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
    },
  });

  if (user) {
    await setCache(cacheKey, user, 120);
  }

  return user;
};

const invalidateUserCache = async (id?: string) => {
  await deleteCache("users:all");
  if (id) await deleteCache(`user:${id}`);
};

export const userService = {
  getAllUsers,
  getSingleUser,
  invalidateUserCache,
};