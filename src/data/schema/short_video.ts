import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { files } from './file';
import { users } from './user';

export const shortVideos = pgTable('short_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileId: uuid('file_id')
    .notNull()
    .references(() => files.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ShortVideo = InferSelectModel<typeof shortVideos>;
export type NewShortVideo = InferInsertModel<typeof shortVideos>;
