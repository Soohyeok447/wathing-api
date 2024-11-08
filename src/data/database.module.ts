import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DRIZZLE',
      useFactory: async (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL'),
        });

        const db = drizzle(pool, { schema });

        try {
          Logger.log(
            'Database connection established successfully',
            'DatabaseModule',
          );

          // 간단한 쿼리를 실행하여 schema가 제대로 적용되었는지 확인
          const tables = await db.execute(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
          );

          Logger.log(
            'Tables in database:',
            JSON.stringify(tables.rows),
            'DatabaseModule',
          );
        } catch (error) {
          Logger.error(
            'Failed to connect to the database',
            error,
            'DatabaseModule',
          );
          throw error;
        }

        return drizzle(pool, { schema });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DRIZZLE'],
})
export class DatabaseModule {}
