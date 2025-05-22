import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildController } from './build.controller';
import { BuildService } from './build.service';
import { Build } from '../../entities/build.entity';
import { Queue } from '../../entities/queue.entity';
import { QueueService } from '../queue/queue.service';
@Module({
  imports: [TypeOrmModule.forFeature([Queue, Build])],
  controllers: [BuildController],
  providers: [BuildService],
})
export class BuildModule {}
