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
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FlowService } from './flow.service';
import { Flow } from '../../entities/flow.entity';
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

@Controller('api/flow')
@UseGuards(JwtAuthGuard)
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post('data')
  updateFlowData(@Body() body: Flow) {
    if (!body.flowConfig) {
      throw new BadRequestException('flowConfig 不能为空');
    }
    return this.flowService.updateFlowData(body);
  }

  @Delete('data/:id')
  deleteFlowData(@Param('id') id: number) {
    return this.flowService.delete(id);
  }

  @Get('data/:id')
  getFlowData(@Param('id') id: number) {
    return this.flowService.getFlowData(id);
  }
}
