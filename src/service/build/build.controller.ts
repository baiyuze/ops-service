import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  NotFoundException,
  BadRequestException,
  Res,
  // Response,
  Header,
  Logger,
  Query,
} from '@nestjs/common';
import { BuildService } from './build.service';
import { Build } from '../../entities/build.entity';
import { Queue } from '../../entities/queue.entity';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import {
  actionTempScript,
  createTempScript,
  getScriptExt,
} from 'src/common/utils';
import { createReadStream } from 'fs';
import { join, resolve } from 'path';
import { StreamableFile } from '@nestjs/common';
import { stat } from 'fs/promises';
import { Observable } from 'rxjs';
import { LoggerMiddleware } from 'src/middleware/logger.middleware';
import * as dayjs from 'dayjs';
import { Response } from 'express';
interface MessageEvent {
  data: string;
}

export interface BuildConfig {
  bash?: string;
  branch: string;
  environment: string;
  script: string;
  variables: string[];
}
/**
 * 构建配置控制器
 * 处理与构建配置相关的 HTTP 请求
 */
@Controller('api/build')
export class BuildController {
  private readonly logger = new Logger(LoggerMiddleware.name);
  constructor(private readonly buildService: BuildService) {}

  /**
   * 创建新的构建配置
   * @param buildData - 构建配置数据
   * @returns 返回创建的构建配置对象
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createBuildConfig(@Body() buildData: Partial<Build>) {
    return this.buildService.create(buildData);
  }

  /**
   * 获取所有构建配置
   * @returns 返回构建配置对象数组
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getBuildConfigs(): Promise<Build[]> {
    return this.buildService.findAll();
  }

  /**
   * 根据ID获取特定的构建配置
   * @param id - 构建配置的ID
   * @returns 返回指定ID的构建配置对象
   * @throws NotFoundException 当找不到指定ID的配置时抛出异常
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getBuildConfig(@Param('id') id: string): Promise<Build> {
    const buildConfig = await this.buildService.findOne(+id);
    if (!buildConfig) {
      throw new NotFoundException(`未找到ID为 ${id} 的构建配置`);
    }
    return buildConfig;
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async start(@Param('id') id: string, @Body() body: BuildConfig) {
    const buildConfig = await this.buildService.findBuildOne(+id);
    if (!buildConfig) {
      throw new NotFoundException(`未找到ID为 ${id} 的构建配置`);
    }
    if (!body.branch) {
      throw new BadRequestException('未指定分支');
    }
    await this.buildService.createQueue(buildConfig, body);
    return '开始构建';
  }

  /**
   * 获取构建日志
   * @param versionId - 版本ID
   * @returns 返回日志内容的 Promise
   * @throws NotFoundException 当找不到日志文件时抛出异常
   */
  @Get('log/:id')
  @UseGuards(JwtAuthGuard)
  async getBuildLog(
    @Param('id') versionId: string,
    @Query() query: { logName: string },
  ): Promise<{ content: string; versionId: string }> {
    try {
      const logName = query.logName || 'build.log';
      const logPath = resolve(process.env.NAMESPACE, versionId, logName);
      // 检查文件是否存在
      await stat(logPath);

      // 使用 Promise 异步读取文件内容
      const content = await new Promise<string>((resolve, reject) => {
        const chunks: string[] = [];
        const fileStream = createReadStream(logPath, { encoding: 'utf8' });

        fileStream.on('data', (chunk) => chunks.push(chunk.toString()));
        fileStream.on('end', () => resolve(chunks.join('')));
        fileStream.on('error', (error) => reject(error));
      });
      // this.buildService.update(versionId, { status: 2 });
      return {
        content,
        versionId,
      };
    } catch (error) {
      this.logger.error(`未找到版本 ${versionId} 的构建日志: ${error.message}`);
    }
  }
  // 获取文件目录
  @Get('files/:id')
  @UseGuards(JwtAuthGuard)
  async getFiles(@Param('id') versionId: string, @Query('path') path?: string) {
    return this.buildService.getFiles(versionId, path);
  }

  @Get('files/:id/download')
  async downloadFile(
    @Param('id') versionId: string,
    @Query('name') name?: string,
    @Query('pathName') pathName?: string,
  ) {
    const fileStream = await this.buildService.downloadFile(
      versionId,
      pathName,
    );
    return new StreamableFile(fileStream, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="${encodeURIComponent(name)}"`,
    });
  }
}
