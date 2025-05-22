import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { Flow } from 'src/entities/flow.entity';
import { User } from 'src/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Flow])],
  providers: [FlowService],
  controllers: [FlowController],
})
export class FlowModule {}
