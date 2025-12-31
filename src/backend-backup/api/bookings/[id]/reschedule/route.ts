import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'
import { addMinutes } from 'date-fns'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const id = params.id
  if (!id) return new NextResponse('Bad Request: missing id', { status: 400 })
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { newStartTime, durationMins } = body
  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return new NextResponse('Not found', { status: 404 })
  const userId = (session.user as any).id || (session as any).userId
  const isOwner = booking.userId === userId
  const isAdmin = (session.user as any).role === 'ADMIN'
  if (!isOwner && !isAdmin) return new NextResponse('Forbidden', { status: 403 })

  const start = new Date(newStartTime)
  const end = addMinutes(start, durationMins || 60)

  const overlap = await prisma.booking.findFirst({
    where: {
      courtId: booking.courtId,
      id: { not: booking.id },
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [{ startTime: { lt: end }, endTime: { gt: start } }]
    }
  })
  if (overlap) return new NextResponse('Slot not available', { status: 409 })

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { startTime: start, endTime: end }
  })
  return NextResponse.json(updated)
}
