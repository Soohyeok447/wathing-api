import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DRIZZLE',
      useFactory: async (configService: ConfigService) => {
        const pool = new Pool({
          connectionString: configService.getOrThrow<string>('DATABASE_URL'),
        });
        return drizzle(pool);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DRIZZLE'],
})
export class DatabaseModule {}
