import { db } from './index'
import { users } from './schema'
import bcrypt from 'bcryptjs'

async function seed() {
  const password = await bcrypt.hash('changeme', 12)
  await db.insert(users).values({
    name: 'Admin',
    email: 'admin@velumina.app',
    password,
  }).onConflictDoNothing()
  console.log('✅ Seed complete')
  process.exit(0)
}

seed()