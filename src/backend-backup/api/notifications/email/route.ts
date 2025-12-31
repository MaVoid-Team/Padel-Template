import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  const { to, subject, html } = await req.json()
  await sendEmail(to, subject, html)
  return NextResponse.json({ ok: true })
}
