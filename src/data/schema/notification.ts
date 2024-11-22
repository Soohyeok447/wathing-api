import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from '.';
import { InferSelectModel } from 'drizzle-orm';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'new_post', 'chat_request', 'message', 'follow_request'
  data: text('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  read: boolean('read').default(false).notNull(),
});

export type Notification = InferSelectModel<typeof notifications>;
