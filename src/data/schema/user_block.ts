import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './user';

export const userBlocks = pgTable('user_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  blockedUserId: uuid('blocked_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  blockedBy: uuid('blocked_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type UserBlock = InferSelectModel<typeof userBlocks>;
export type NewUserBlock = InferInsertModel<typeof userBlocks>;
