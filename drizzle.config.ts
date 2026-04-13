import { defineConfig } from 'drizzle-kit'

const dbUrl = process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST ?? 'db'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB}`

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
})
