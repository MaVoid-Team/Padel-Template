import { Resend } from 'resend'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !resend) {
    console.warn('RESEND_API_KEY not set - skipping email send')
    return
  }
  await resend.emails.send({
    from: process.env.RESEND_FROM || 'no-reply@example.com',
    to,
    subject,
    html
  })
}
