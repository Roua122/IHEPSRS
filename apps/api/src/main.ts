import 'reflect-metadata';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN'),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('IHEPSRS API')
    .setDescription('Academic Prototype API')
    .setVersion(config.get<string>('APP_VERSION') ?? '0.1.2')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.getOrThrow<number>('API_PORT');
  await app.listen(port);

  console.log(`IHEPSRS API running on http://localhost:${port}/api`);
}

bootstrap();
