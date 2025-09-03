# Padel Reservation MVP (Next.js App Router)

Features:
- Auth: email/password, Google, Facebook, phone+password (MVP)
- Courts CRUD (API for now), Bookings CRUD (create, cancel, reschedule)
- Payments: Paymob (Accept) checkout + Cash on Arrival
- Email notifications via Resend
- Admin dashboard (stats + recent bookings)

## Setup

1) Clone/unzip this folder.
2) `npm i`
3) Copy `.env.example` to `.env` and fill values.
4) Start a Postgres DB (or use Supabase). Set `DATABASE_URL`.
5) `npx prisma migrate dev` (creates tables).
6) Seed at least one court (via Prisma Studio or POST /api/courts with admin session).
7) `npm run dev` and open http://localhost:3000

## Auth

- Email/Phone + password using Credentials provider.
- Google/Facebook OAuth (set client ID/secret).
- To make someone admin, set `role` to `ADMIN` in DB.

## Paymob

- Fill `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET` in `.env`.
- The `/api/paymob/checkout` returns an iframe URL and redirects the client.
- Implement proper HMAC verification in `/api/paymob/webhook` before production.

## Resend (Email)

- Fill `RESEND_API_KEY` and `RESEND_FROM` in `.env`.
- Use `/api/notifications/email` to send confirmation/cancellation emails.

## Notes

- Availability check prevents overlapping PENDING/CONFIRMED bookings per court.
- Amount is stored in piastres (cents) to avoid float issues.
- Admin dashboard is a minimal MVP.
- Extend UI with your branding and better calendar components.
