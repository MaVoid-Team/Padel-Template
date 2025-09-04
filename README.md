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

## Deploy with Docker Compose + Nginx

1) Copy `.env.example` to `.env` and set values. For Compose, `DATABASE_URL` should point to `db` service, e.g. `postgresql://padel:padel@db:5432/padel?schema=public`.
2) On your VPS with Docker, run:

	- Build and start: `docker compose up -d --build`
	- Run migrations once (when schema changes): `docker compose run --rm migrate`

3) Visit your server IP/domain on port 80. Adjust `NEXTAUTH_URL` and `APP_URL` to your domain.

Notes:
- TLS: Terminate HTTPS at Nginx. Add certs (e.g., via certbot) and listen on 443 in `nginx/nginx.conf`.
- Scaling: You can add `deploy.replicas` (Swarm) or use Docker Compose profiles and an external load balancer.
- Logs: `docker compose logs -f app` and `docker compose logs -f nginx`.
- Prisma: In containers, `DATABASE_URL` must be reachable from the app container. The provided Compose sets it to the `db` service by default.

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
