import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../core/guards/jwt.strategy';
import { FilesModule } from '../files/files.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../data/database.module';
import { UsersModule } from '../users/users.module';
import { GqlAuthGuard } from '../core/guards/gql.guard';

@Module({
  imports: [
    ConfigModule,
    FilesModule,
    DatabaseModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, GqlAuthGuard],
  controllers: [AuthController],
  exports: [GqlAuthGuard],
})
export class AuthModule {}
