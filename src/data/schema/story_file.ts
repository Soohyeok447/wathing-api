import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { stories } from './story';
import { files } from './file';

export const storyFiles = pgTable(
  'story_files',
  {
    storyId: uuid('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.fileId, t.storyId] }),
  }),
);

export type StoryFile = InferSelectModel<typeof storyFiles>;
export type NewStoryFile = InferInsertModel<typeof storyFiles>;
