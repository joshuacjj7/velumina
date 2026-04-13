import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const dbUrl = process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST ?? 'db'}:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB}`

const client = postgres(dbUrl)
export const db = drizzle(client, { schema })