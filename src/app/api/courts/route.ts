import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const courts = await prisma.court.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json(courts)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const court = await prisma.court.create({ data: body })
  return NextResponse.json(court, { status: 201 })
}
