import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { paymobAuthToken, paymobCreateOrder, paymobPaymentKey, paymobIframeUrl } from '@/lib/paymob'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { bookingId, billing } = body

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return new NextResponse('Booking not found', { status: 404 })

  const token = await paymobAuthToken()
  const order = await paymobCreateOrder(token, booking.amount, booking.currency, booking.id)
  const paymentKey = await paymobPaymentKey(token, order.id, booking.amount, billing, process.env.PAYMOB_INTEGRATION_ID!)
  const iframeUrl = paymobIframeUrl(paymentKey)

  // Mark PENDING; payment confirmed by webhook
  await prisma.booking.update({ where: { id: booking.id }, data: { paymobOrderId: String(order.id), paymentMethod: 'PAYMOB' } })

  return NextResponse.json({ iframeUrl })
}
