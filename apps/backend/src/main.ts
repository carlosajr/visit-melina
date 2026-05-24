import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      const allowed = (process.env.FRONTEND_URL ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error(`CORS bloqueado para origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Visite a Melina — API')
    .setDescription('Backend para agendamento de visitas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🌸 Backend rodando em http://localhost:${port}`);
  console.log(`📖 Swagger em http://localhost:${port}/docs`);
}
void bootstrap();
