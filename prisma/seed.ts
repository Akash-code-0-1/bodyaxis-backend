import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  await prisma.subscriptionPlan.upsert({
    where: {
      id: '11111111-1111-1111-1111-111111111111',
    },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Axis Premium Monthly',
      description:
        'One plan. Unlimited performance. Unlock every protocol in our library.',
      billingCycle: 'MONTHLY',
      price: 29.99,
      currency: 'USD',
      discountPercent: 0,
      features: [
        'Unlimited Protocol Access',
        'Advanced Biomechanical Data',
        'Elite Coaching Insights',
        'Cross-Device Sync',
      ],
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: {
      id: '22222222-2222-2222-2222-222222222222',
    },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Axis Premium Annual',
      description:
        'One plan. Unlimited performance. Unlock every protocol in our library.',
      billingCycle: 'YEARLY',
      price: 299.99,
      currency: 'USD',
      discountPercent: 17,
      features: [
        'Unlimited Protocol Access',
        'Advanced Biomechanical Data',
        'Elite Coaching Insights',
        'Cross-Device Sync',
      ],
    },
  });
};

main()
  .then(async () => {
    console.log('✅ Subscription plans seeded');
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });