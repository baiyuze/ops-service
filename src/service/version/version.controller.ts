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
} from '@nestjs/common';
import { VersionService } from './version.service';
import { Version } from '../../entities/version.entity';
import {
  ApiProperty,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiHeaders,
  ApiHeader,
} from '@nestjs/swagger';
import { Validator } from 'src/common/decorator/validator.decorator';
import { JwtAuthGuard } from 'src/common/auth/jwtAuth.guard';

@Controller('api/version')
@UseGuards(JwtAuthGuard)
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  // @Get('all')
  // getHello(): Promise<Version[]> {
  //   return this.versionService.findAll();
  // }
  // @Get('one')
  // @ApiOperation({ summary: '根据ID获取数据' })
  // @ApiQuery({ name: 'id' })
  // getOne(@Query() query): Promise<Version> {
  //   const id: string = query.id;
  //   return this.versionService.findOne(id);
  // }
  /**
   * 获取数据
   * @param query
   * @returns
   */
  @Get('iteration')
  async list(
    @Query()
    query,
    @Headers() headers,
  ): Promise<any> {
    return this.versionService.findAll(query, headers);
  }
  /**
   * 更新
   * @param body
   * @returns
   */
  @Put('iteration')
  async update(
    @Body()
    body,
  ): Promise<any> {
    return this.versionService.update(body);
  }
  /**
   * 删除
   * @param body
   * @returns
   */
  @Delete('iteration')
  async delete(@Body() body): Promise<any> {
    if (!body.id) throw new BadGatewayException('id不能为空');
    return this.versionService.delete(body.id);
  }
  /**
   * 添加
   * @param body
   * @param headers
   * @returns
   */
  @Post('iteration')
  @ApiBody({
    type: Version,
  })
  @Validator([
    {
      reg: /^.{1,18}$/,
      key: 'name',
      msg: '项目名需为1-18位的字符',
      required: true,
    },
  ])
  async insert(@Body() body, @Headers() headers): Promise<any> {
    return this.versionService.insert(body, headers);
  }
}
