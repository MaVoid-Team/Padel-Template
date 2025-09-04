import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(_: NextRequest, { params }: { params: Record<string, string | string[]> }) {
  const raw = params['id']
  const id = Array.isArray(raw) ? raw[0] : raw
  if (!id) return new NextResponse('Bad Request: missing id', { status: 400 })
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const booking = await prisma.booking.findUnique({ where: { id } })
  if (!booking) return new NextResponse('Not found', { status: 404 })
  const userId = (session.user as any).id || (session as any).userId
  const isOwner = booking.userId === userId
  const isAdmin = (session.user as any).role === 'ADMIN'
  if (!isOwner && !isAdmin) return new NextResponse('Forbidden', { status: 403 })
  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
  return NextResponse.json(updated)
}
