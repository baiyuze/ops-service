import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http.exception';
import { DataPackage } from './common/data.interceptor';
import { Logger } from './common/log4js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { setGitCredentials } from './common/utils';
async function bootstrap() {
  // 设置git凭证
  if (process.env.NODE_ENV === 'production') {
    setGitCredentials(
      process.env.GIT_USERNAME,
      process.env.GIT_PASSWORD,
      process.env.GIT_EMAIL,
    );
  }
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
  });
  app.useGlobalFilters(new HttpExceptionFilter()); //错误信息统一包装拦截
  app.useGlobalInterceptors(new DataPackage()); //拦截数据进行包装
  const config = new DocumentBuilder()
    .setTitle('LMES')
    .setDescription('LMES API description')
    .setVersion('1.0')
    .addTag('LMES')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
  await app.listen(3000);
}
bootstrap();
