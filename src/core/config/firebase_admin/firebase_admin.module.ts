import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require('./wathing-fcm-key.json');

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseAdminModule {}
