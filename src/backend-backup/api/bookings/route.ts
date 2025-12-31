import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { addMinutes, isBefore } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const userId = (session.user as any).id || (session as any).userId
  const bookings = await prisma.booking.findMany({ where: { userId }, include: { court: true }, orderBy: { startTime: 'desc' } })
  return NextResponse.json(bookings)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const user = (session as any).user
  const body = await req.json()
  const { courtId, startTime, durationMins, amount, paymentMethod } = body
  const start = new Date(startTime)
  const end = addMinutes(start, durationMins || 60)

  // Check availability: no overlapping confirmed or pending bookings for same court
  const overlap = await prisma.booking.findFirst({
    where: {
      courtId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [
        { startTime: { lt: end }, endTime: { gt: start } }
      ]
    }
  })
  if (overlap) return new NextResponse('Slot not available', { status: 409 })

  const booking = await prisma.booking.create({
    data: {
      courtId,
      userId: user.id,
      startTime: start,
      endTime: end,
      amount,
      paymentMethod,
      status: paymentMethod === 'CASH' ? 'CONFIRMED' : 'PENDING',
      paymentStatus: paymentMethod === 'CASH' ? 'UNPAID' : 'UNPAID'
    }
  })
  return NextResponse.json(booking, { status: 201 })
}
