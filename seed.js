const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Delete existing courts
  await prisma.court.deleteMany({});

  // Create test courts
  const courts = await prisma.court.createMany({
    data: [
      {
        name: 'Court 1 - Premium',
        location: 'Downtown Cairo',
        isActive: true,
        openTime: 8,
        closeTime: 23,
        slotMins: 60
      },
      {
        name: 'Court 2 - Standard',
        location: 'Nasr City',
        isActive: true,
        openTime: 8,
        closeTime: 23,
        slotMins: 60
      },
      {
        name: 'Court 3 - Economy',
        location: 'New Cairo',
        isActive: true,
        openTime: 8,
        closeTime: 23,
        slotMins: 60
      },
      {
        name: 'Court 4 - Premium Plus',
        location: 'Maadi',
        isActive: true,
        openTime: 7,
        closeTime: 24,
        slotMins: 60
      }
    ]
  });

  console.log('✅ Created', courts.count, 'courts');

  // Verify courts were created
  const allCourts = await prisma.court.findMany();
  console.log('📋 All courts in database:', allCourts.map(c => ({ id: c.id, name: c.name })));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
