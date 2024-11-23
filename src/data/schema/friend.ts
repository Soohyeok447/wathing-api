import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './user';

export const friends = pgTable(
  'friends',
  {
    userId1: uuid('user_id1')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userId2: uuid('user_id2')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey(t.userId1, t.userId2),
  }),
);

export type Friend = InferSelectModel<typeof friends>;
export type NewFriend = InferInsertModel<typeof friends>;
