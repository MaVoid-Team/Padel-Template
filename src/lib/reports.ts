import { prisma } from '@/lib/prisma'

export async function revenueByDay() {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT date_trunc('day', "createdAt") AS day, SUM(amount)/100 AS revenue_egp
    FROM "Booking"
    WHERE "paymentStatus" = 'PAID'
    GROUP BY day
    ORDER BY day DESC
    LIMIT 30;
  `)
  return result
}

export async function topPlayers(limit = 10) {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT u."name", u."email", COUNT(b.*) as bookings
    FROM "Booking" b
    JOIN "User" u ON u.id = b."userId"
    GROUP BY u.id
    ORDER BY bookings DESC
    LIMIT ${limit};
  `)
  return result
}
