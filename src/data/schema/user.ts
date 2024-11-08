import { pgTable, varchar, uuid, timestamp, text } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { files } from '.';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  birthday: timestamp('birthday', { mode: 'date' }).notNull(),
  statusMessage: text('status_message').default('').notNull(),
  profileImageId: uuid('profile_image_id').references(() => files.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users> & {
  profileImageId?: string;
};
