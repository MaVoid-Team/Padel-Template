import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { name, email, phone, password } = body
  if (!email && !phone) return new NextResponse('Email or phone required', { status: 400 })
  const passwordHash = password ? await bcrypt.hash(password, 10) : null
  try {
    const user = await prisma.user.create({ data: { name, email, phone, passwordHash } })
    return NextResponse.json({ id: user.id })
  } catch (e: any) {
    return new NextResponse('User exists or invalid data', { status: 400 })
  }
}
