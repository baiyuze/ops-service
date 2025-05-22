import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkFlowService } from './workFlow.service';
import { WorkFlowController } from './workFlow.controller';
import { WorkFlow } from 'src/entities/workFlow.entity';
import { User } from 'src/entities/user.entity';
import { FlowService } from '../flow/flow.service';
import { Flow } from 'src/entities/flow.entity';
import { Build } from 'src/entities/build.entity';
import { BuildService } from '../build/build.service';
import { Queue } from 'src/entities/queue.entity';
@Module({
  imports: [TypeOrmModule.forFeature([WorkFlow, User, Flow, Build, Queue])],
  providers: [WorkFlowService, FlowService, BuildService],
  controllers: [WorkFlowController],
})
export class WorkFlowModule {}
