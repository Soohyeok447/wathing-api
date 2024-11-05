import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './user';
import { files } from './file';

export const chats = pgTable('chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  receiverId: uuid('receiver_id')
    .notNull()
    .references(() => users.id),
  message: text('message'),
  chatImageId: uuid('chat_image_id').references(() => files.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Chat = InferSelectModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;
