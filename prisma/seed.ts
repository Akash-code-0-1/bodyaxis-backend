import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@fitness.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@fitness.com",
      password,
      role: Role.ADMIN,
    },
  });

  console.log("Seed completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });