import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  // CORS: em demo na LAN, CORS_ALLOW_ALL=true reflete o Origin da requisição
  const allowAll = (config.get<string>('CORS_ALLOW_ALL') ?? 'false').toLowerCase() === 'true';
  const origins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowAll
      ? true
      : (origin, callback) => {
          if (!origin || origins.includes(origin)) {
            callback(null, true);
            return;
          }
          // Permite qualquer IP da rede local (10.x, 192.168.x, 172.16-31.x) na porta 3000
          if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error(`CORS blocked: ${origin}`), false);
        },
    credentials: true,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api', { exclude: ['health', 'health/ready'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swagger = new DocumentBuilder()
    .setTitle('SubscriptionHub API')
    .setDescription('Copiloto Financeiro Pessoal — REST API v1')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT') ?? 4000;
  const host = config.get<string>('HOST') ?? '0.0.0.0';
  await app.listen(port, host);
  logger.log(`API listening on http://${host}:${port}`);
}

bootstrap();
