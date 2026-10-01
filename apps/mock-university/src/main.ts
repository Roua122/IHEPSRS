import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = Number(process.env.MOCK_UNIVERSITY_PORT ?? 3100);
  await app.listen(port);

  console.log(`Mock University running on http://localhost:${port}`);
}

bootstrap();
