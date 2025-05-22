import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionModule } from './service/version/version.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
// import { JwtMiddleware } from './middleware/jwt.middleware';
import { LoginModule } from './service/login/login.module';
import { FileModule } from './service/file/file.module';
import { mysqlConfig } from '../config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'path';
import { BuildModule } from './service/build/build.module';
import { QueueModule } from './service/queue/queue.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FlowModule } from './service/flow/flow.module';
import { WorkFlowModule } from './service/workFlow/workFlow.module';
const isProduction = process.env.NODE_ENV === 'production';

const business = [
  LoginModule,
  FileModule,
  VersionModule,
  BuildModule,
  QueueModule,
  FlowModule,
  WorkFlowModule,
];
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolve(process.cwd(), 'public'),
    }),
    TypeOrmModule.forRoot({
      ...mysqlConfig,
    }),
    JwtModule.register({
      secret: 'dev_ops',
      global: true,
      signOptions: {
        //token的有效时长
        expiresIn: '24h',
      },
    }),
    ConfigModule.forRoot({
      envFilePath: isProduction
        ? ['.env']
        : ['.env.development.local', '.env.development', '.env'],
    }),
    ScheduleModule.forRoot(),
    ...business,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    // consumer.apply(JwtMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
