import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

function verifyHmac(body: any) {
  const hmac = body?.hmac
  if (!hmac) return false
  // Basic example, you should sort fields per Paymob docs; keep as MVP placeholder
  const secret = process.env.PAYMOB_HMAC_SECRET || ''
  const str = JSON.stringify(body.obj || {})
  const digest = crypto.createHmac('sha512', secret).update(str).digest('hex')
  return digest === hmac
}

export async function POST(req: Request) {
  const body = await req.json()
  // TODO: Implement Paymob exact HMAC procedure according to docs
  // For MVP we'll accept and mark paid if success === true; replace with proper verification in prod.
  const success = body?.obj?.success === true

  if (!success) return NextResponse.json({ ok: true })

  const orderId = String(body?.obj?.order?.id || '')
  const transactionId = String(body?.obj?.id || '')

  const booking = await prisma.booking.findFirst({ where: { paymobOrderId: orderId } })
  if (!booking) return NextResponse.json({ ok: true })

  await prisma.booking.update({
    where: { id: booking.id },
    data: { paymentStatus: 'PAID', status: 'CONFIRMED', paymobTransactionId: transactionId }
  })

  return NextResponse.json({ ok: true })
}
