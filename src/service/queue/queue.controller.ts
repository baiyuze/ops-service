import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { Queue } from '../../entities/queue.entity';

@Controller('/api/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async create(@Body() queueData: Partial<Queue>) {
    return await this.queueService.create(queueData);
  }

  @Get()
  async findAll(
    @Query() query: any,
  ): Promise<{ items: Queue[]; total: number }> {
    return await this.queueService.findAll({
      pageNum: query.pageNum ? parseInt(query.pageNum) : 0,
      pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
      status: query.status ? parseInt(query.status) : undefined,
      buildId: query.buildId ? parseInt(query.buildId) : undefined,
      versionId: query.versionId ? parseInt(query.versionId) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Queue> {
    return await this.queueService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() queueData: Partial<Queue>,
  ): Promise<Queue> {
    return await this.queueService.update(id, queueData);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return await this.queueService.remove(id);
  }

  @Post('stop/:id')
  async stop(@Param('id') id: number) {
    return await this.queueService.stop(id);
  }
}
