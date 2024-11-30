import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './user';

export const credentials = pgTable('credentials', {
  id: text('id').notNull().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  password: text('password').notNull(),
  refreshToken: text('refresh_token').notNull(),
  deviceToken: text('device_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

export type Credential = InferSelectModel<typeof credentials> & {
  deviceToken: string | null;
};
export type NewCredential = InferInsertModel<typeof credentials>;
