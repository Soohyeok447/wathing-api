import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { stories } from './story';
import { users } from './user';

export const storyLikes = pgTable(
  'story_likes',
  {
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storyId, t.userId] }),
  }),
);

export type StoryLike = InferSelectModel<typeof storyLikes>;
export type NewStoryLike = InferInsertModel<typeof storyLikes>;
