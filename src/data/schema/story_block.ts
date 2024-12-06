import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './user';
import { stories } from './story';

export const storyBlocks = pgTable('story_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id')
    .notNull()
    .references(() => stories.id, { onDelete: 'cascade' }),
  blockedBy: uuid('blocked_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type StoryBlock = InferSelectModel<typeof storyBlocks>;
export type NewStoryBlock = InferInsertModel<typeof storyBlocks>;
