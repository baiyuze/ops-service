import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  UseFilters,
  BadGatewayException,
  Delete,
  Headers,
  UseGuards,
  Put,
  Param,
} from '@nestjs/common';
import { WorkFlowService } from './workFlow.service';
import { WorkFlow } from '../../entities/workFlow.entity';
import {
  ApiProperty,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiHeaders,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/auth/jwtAuth.guard';
import { CurrentHeaderType, Page } from '../file/types';
import { FlowService } from '../flow/flow.service';

export interface PageParams extends Page {
  name: string;
}

export interface VariableItemType {
  key: string;
  value: string;
}
@Controller('api/workFlow')
@UseGuards(JwtAuthGuard)
export class WorkFlowController {
  constructor(
    private readonly workFlowService: WorkFlowService,
    private readonly flowService: FlowService,
  ) {}

  @Get('flow')
  async getList(@Query() query: PageParams) {
    return this.workFlowService.findAll(query);
  }

  @Get('flow/:id')
  async getFlow(@Param('id') id: number) {
    return this.workFlowService.findOne(id);
  }

  @Post('flow')
  async insertWorkFlow(
    @Body() body: WorkFlow,
    @Headers() headers: CurrentHeaderType,
  ) {
    return await this.workFlowService.insert(body, headers);
  }

  @Put('flow/:id')
  async updateWorkFlow(@Param('id') id: number, @Body() body: WorkFlow) {
    return this.workFlowService.update(id, body);
  }

  @Delete('flow/:id')
  async deleteWorkFlow(@Param('id') id: number) {
    return this.workFlowService.delete(id);
  }
  @Post('flow/:id')
  async startWorkFlow(
    @Body() variableData: VariableItemType[],
    @Param('id') id: number,
  ) {
    await this.workFlowService.updateVariable(id, JSON.stringify(variableData));
    this.workFlowService.startWorkFlow(id, variableData);
  }
}
