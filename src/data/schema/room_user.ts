import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { rooms } from './room';
import { users } from './user';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const roomUsers = pgTable(
  'room_users',
  {
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey(t.roomId, t.userId),
  }),
);

export type RoomUser = InferSelectModel<typeof roomUsers>;
export type NewRoomUser = InferInsertModel<typeof roomUsers>;
