import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/data/schema/*'],
  out: './src/data/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
