import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { DatabaseModule } from '../data/database.module';
import { FirebaseAdminModule } from '../core/config/firebase_admin/firebase_admin.module';

@Module({
  imports: [DatabaseModule, FirebaseAdminModule],
  providers: [NotificationsService, NotificationsResolver],
  exports: [NotificationsService],
})
export class NotificationsModule {}
