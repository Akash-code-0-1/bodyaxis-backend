"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const password = await bcrypt_1.default.hash("admin123456", 10);
    await prisma.user.upsert({
        where: { email: "admin@fitness.com" },
        update: {},
        create: {
            name: "Super Admin",
            email: "admin@fitness.com",
            password,
            role: client_1.Role.ADMIN,
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
