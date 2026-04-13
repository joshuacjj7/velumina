# Velumina

A self-hosted event photo sharing platform built for weddings, birthdays, reunions, and other memorable occasions. Guests scan a QR code, browse the gallery, and upload their own photos — no app downloads, no accounts, no external dependencies.

## Features

### For Guests
- **QR code access** — scan and go, no sign-up required
- **Photo gallery** — browse event photos with infinite scroll
- **Photo uploads** — contribute photos with optional captions
- **Interactive photo book** — flip through photos in a page-turn format
- **RSVP** — respond with attendance, guest count, and dietary notes
- **Password-protected events** — private galleries for invited guests only

### For Admins
- **Event management** — create, edit, and delete events with unique slugs
- **Media management** — approve, reject, and delete uploads from a grid view
- **RSVP dashboard** — track guest responses and export to CSV
- **Team management** — invite team members with token-based signup
- **Gallery exports** — download all event photos as a zip archive
- **Disk usage monitoring** — keep track of storage consumption
- **Automatic thumbnails** — web-optimized versions and blur hashes generated on upload
- **Email notifications** — RSVP confirmations, team invites, and automated reminders via Resend

## Inspiration

Velumina was born from a simple frustration: group photo sharing at events is a mess. Photos end up scattered across WhatsApp groups, AirDrop chains, Google Drive links, and half-forgotten albums. Guests shouldn't need to download an app or create an account just to see and share photos from a celebration.

The name *Velumina* draws from the Latin *velum* (veil, covering) — evoking the idea of unveiling and preserving precious moments. The platform is designed to be **beautiful by default**: warm tones, elegant typography, and a gallery-focused aesthetic that feels fitting for life's most meaningful occasions, not like a generic file dump.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) with React 19 and TypeScript |
| Database | PostgreSQL 16 via Drizzle ORM |
| Auth | NextAuth v5 (session-based) |
| Storage | Local filesystem (configurable via `UPLOADS_DIR`) |
| Image Processing | Sharp (thumbnails, WebP conversion, blur hashes) |
| Video | FFmpeg (installed in Docker image) |
| Styling | Tailwind CSS v4 |
| Email | Resend |
| QR Codes | qrcode.react |
| Deployment | Docker (multi-stage build, Node 22 Alpine) |

## Design

- **Palette:** Ivory `#FAF7F2`, Charcoal `#1C1C1C`, Rose `#C4907A`, Gold `#B8955A`
- **Typography:** Cormorant Garamond (display) + DM Sans (body)
- **Aesthetic:** Warm, sentimental, gallery-focused

## Getting Started

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 22+ and PostgreSQL 16 for local development without Docker

### Setup

1. Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

2. Start the services:

```bash
docker compose up --build
```

3. Run the database seed to create the default admin account:

```bash
docker compose exec app node node_modules/tsx/dist/cli.mjs db/seed.ts
```

4. Log in at `http://localhost:3005/admin` with:
   - Email: `admin@velumina.app`
   - Password: `changeme`

> Change the default password immediately from the admin settings page.

### Production

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

The production compose pulls the pre-built image from `ghcr.io/joshuacjj7/velumina:latest`. Database migrations run automatically on startup.

### Environment Variables

Copy `.env.example` and configure the following:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `velumina` |
| `POSTGRES_PASSWORD` | PostgreSQL password | — |
| `POSTGRES_DB` | PostgreSQL database name | `velumina` |
| `POSTGRES_HOST` | PostgreSQL host (`db` in Docker, `localhost` without) | `db` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `AUTH_SECRET` | NextAuth session secret (generate with `openssl rand -base64 32`) | — |
| `AUTH_TRUST_HOST` | Trust the host header (required behind reverse proxies) | `true` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (used in emails and QR codes) | `http://localhost:3005` |
| `UPLOADS_DIR` | File storage path (host volume mount in Docker) | `./uploads` |
| `RESEND_API_KEY` | Resend API key for email notifications | — |
| `RESEND_FROM_EMAIL` | Sender email address (must be verified with Resend) | — |
| `CRON_SECRET` | Secret token to authenticate cron endpoint calls | — |

### Without Docker

Requires a running PostgreSQL instance.

```bash
cp .env.example .env.local
# Edit .env.local — set POSTGRES_HOST=localhost and your DB credentials
npm install
npm run db:push
npm run db:seed
npm run dev
```

The dev server runs on `http://localhost:3006`.

## Project Structure

```
app/
├── admin/          # Admin dashboard, event management, team settings
├── api/            # API routes (upload, photo serving, RSVP, exports)
├── e/[slug]/       # Guest-facing event pages (gallery, RSVP, photo book)
├── invite/         # Team invite acceptance flow
├── login/          # Admin login
└── page.tsx        # Landing page
db/
├── schema.ts       # Drizzle ORM schema (users, events, media, RSVPs)
├── seed.ts         # Database seeder (default admin account)
└── migrations/     # Generated migration files
```

## License

This project is open source.
