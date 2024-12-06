import {
  pgTable,
  varchar,
  uuid,
  timestamp,
  text,
  boolean,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { files } from '.';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: text('email').notNull(),
  birthday: text('birthday').notNull(),
  statusMessage: text('status_message'),
  profileImageId: uuid('profile_image_id').references(() => files.id, {
    onDelete: 'set null',
  }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
