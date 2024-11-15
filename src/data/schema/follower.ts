import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './user';

export const followers = pgTable(
  'followers',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: uuid('following_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey(t.followerId, t.followingId),
  }),
);

export type Follower = InferSelectModel<typeof followers>;
export type NewFollower = InferInsertModel<typeof followers>;
