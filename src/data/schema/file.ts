import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  size: integer('size').notNull(),
  key: text('key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type File = InferSelectModel<typeof files>;
export type NewFile = InferInsertModel<typeof files>;
