import { pgTable, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  isAdmin: boolean('is_admin').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  sessionToken: text('session_token').notNull().unique(),
})

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  date: timestamp('date'),
  coverPhotoId: uuid('cover_photo_id'),
  password: text('password'),  // null = public, set = protected
  uploadsEnabled: boolean('uploads_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  thumbnailFilename: text('thumbnail_filename'),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  webFilename: text('web_filename'),
  size: integer('size').notNull(),
  caption: text('caption'),
  uploadedBy: text('uploaded_by'),
  width: integer('width'),
  height: integer('height'),
  blurDataUrl: text('blur_data_url'),
  mediaType: text('media_type').notNull().default('photo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const invites = pgTable('invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})