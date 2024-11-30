import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-var-requires

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
          throw new Error(
            'FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수가 설정되지 않았습니다.',
          );
        }

        const serviceAccount = JSON.parse(serviceAccountKey);

        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseAdminModule {}
