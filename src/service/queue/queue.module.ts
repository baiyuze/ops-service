import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { Queue } from '../../entities/queue.entity';
import { Build } from '../..//entities/build.entity';
import { BuildService } from '../build/build.service';

@Module({
  imports: [TypeOrmModule.forFeature([Queue, Build])],
  controllers: [QueueController],
  providers: [QueueService, BuildService],
  exports: [QueueService],
})
export class QueueModule {}
