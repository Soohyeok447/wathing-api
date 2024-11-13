import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: `.env.development` });
}

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/data/schema/*'],
  out: './src/data/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
