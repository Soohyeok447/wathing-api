import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({
  path: '.env.local',
});

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./data'],
  out: './data/drizzle',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
