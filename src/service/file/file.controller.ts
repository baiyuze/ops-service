import {
  Body,
  Controller,
  Post,
  Get,
  BadRequestException,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Headers,
  Query,
  Delete,
} from '@nestjs/common';
import { File } from '../../entities/file.entity';
import { FileService } from './file.service';
import { Validator } from '../../common/decorator/validator.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
// import { staticDir } from '../../config';
import { staticDir } from '../../../config';
import { customAlphabet } from 'nanoid';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Page } from './types';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('api/file')
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async fileUpload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Headers() headers,
  ) {
    if (!files) {
      throw new BadRequestException('请上传文件');
    }

    const staticPath = path.resolve(process.env.STATIC_PUBLIC_DIR, staticDir);
    if (!fs.existsSync(staticPath)) {
      fs.mkdirSync(staticPath);
    }
    return await this.fileService.insertFile(files, headers);
  }
  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getFileList(@Query() query: Page, @Headers() headers) {
    return this.fileService.getFileList(query, headers);
  }
  @ApiOperation({ summary: '删除文件' })
  @ApiQuery({ name: 'id' })
  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async delete(@Body() body: { id: number }) {
    return this.fileService.delete(body);
  }
}
