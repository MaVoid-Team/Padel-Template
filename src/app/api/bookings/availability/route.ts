import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const courtId = url.searchParams.get('courtId') || undefined
  const start = url.searchParams.get('start') ? new Date(url.searchParams.get('start')!) : new Date(0)
  const end = url.searchParams.get('end') ? new Date(url.searchParams.get('end')!) : new Date('2100-01-01')
  if (!courtId) return new NextResponse('courtId required', { status: 400 })

  const bookings = await prisma.booking.findMany({
    where: {
      courtId,
      startTime: { gte: start },
      endTime: { lte: end },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    include: { user: true },
    orderBy: { startTime: 'asc' }
  })
  return NextResponse.json(bookings)
}
