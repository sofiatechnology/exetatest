import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { join } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    rawBody: true,
  });
  const port = Number(process.env.PORT ?? 9080);
  const host = process.env.HOST ?? '0.0.0.0';
  const isProduction = process.env.NODE_ENV === 'production';
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true' || !isProduction;

  // Correct client IP behind Render / reverse proxies
  app.set('trust proxy', 1);

  // Enable compression middleware
  app.use(compression());

  // Logo and email assets (absolute URLs used in React Email templates)
  app.useStaticAssets(join(__dirname, 'email', 'templates', 'static'), {
    prefix: '/email-assets',
  });

  // Set global prefix for routes
  app.setGlobalPrefix('api');

  // Enable CORS for all origins
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'https://exetatest--mw6arykang.expo.app',
      'https://exetatest.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('EXETATEST')
      .setDescription('API for EXETATEST')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      ignoreGlobalPrefix: false,
    });

    SwaggerModule.setup('/', app, document);
  } else {
    logger.log('Swagger is disabled in production startup');
  }

  process.on('unhandledRejection', (reason) => {
    logger.error(
      'Unhandled promise rejection',
      reason instanceof Error ? reason.stack : String(reason),
    );
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error.stack);
  });

  await app.listen(port ?? 3000, host ?? '0.0.0.0');
  logger.log(`Server running on http://${host}:${port}`);
}
void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Application bootstrap failed',
    error instanceof Error ? error.stack : String(error),
  );
});
