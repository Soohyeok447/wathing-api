import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http_exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isDevelopment = process.env.NODE_ENV === 'development';

  const host = process.env.HOST || '127.0.0.1';
  const port = parseInt(process.env.PORT, 10) || 3000;

  const corsOptions = {
    origin: isDevelopment ? '*' : `${host}:${port}`,
  };
  app.enableCors(corsOptions);

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder().setTitle('와씽').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
}
bootstrap();
