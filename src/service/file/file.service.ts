import { BadRequestException, Injectable } from '@nestjs/common';
import { File } from '../../entities/file.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
// import { staticDir } from '../../config';
import { staticDir } from '../../../config';
import { customAlphabet } from 'nanoid';
import * as path from 'path';
import * as fs from 'fs-extra';
import { CurrentHeaderType, Page } from './types';
import { JwtService } from '@nestjs/jwt';
import { pushCode } from 'src/common/utils';
import { User } from '../../entities/user.entity';

const nanoid = customAlphabet('1234567890abcdef', 10);

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtServer: JwtService,
  ) {}

  async delete(body: { id: number }) {
    try {
      const file = (await this.fileRepository.findOne({
        id: body.id,
      })) as unknown as File;
      if (!file) {
        throw new BadRequestException('文件不存在');
      }
      (await this.fileRepository.delete({
        id: body.id,
      })) as unknown as File;
      const fileDir = this.getFileDir(file.name);
      await fs.remove(fileDir);
      const filesDir = path.resolve(
        process.env.STATIC_PUBLIC_DIR,
        './resources/assets',
      );
      pushCode(filesDir);
      return '删除成功';
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getFileList(query: Page, headers: CurrentHeaderType) {
    const pageNum = (query.pageNum - 1) * query.pageSize;
    const pageSize = query.pageSize || 20;
    const payload = this.jwtServer.decode(headers.token);
    const userInfo = await this.userRepository.findOne(payload.id);
    const userId = payload.id;
    const where = userInfo.role === 'admin' ? {} : { userId };

    const data = await this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.user', 'user')
      .select(['file', 'user.id', 'user.name'])
      .orderBy('file.createTime', 'DESC')
      .getMany();

    const count = await this.fileRepository.count({ where });
    return {
      total: count,
      list: data,
      pageNum,
      pageSize,
    };
  }
  getFileDir(name) {
    return path.join(process.env.STATIC_PUBLIC_DIR, staticDir, name);
  }

  async insertFile(
    files: Array<Express.Multer.File>,
    headers: CurrentHeaderType,
  ) {
    const fileModels = [];
    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
        let fileUrl = '';
        let type = file.mimetype;
        const fileDir = this.getFileDir(name);
        let fileName = fs.existsSync(fileDir) ? `${nanoid(3)}_${name}` : name;
        fileUrl = `/${staticDir}/${fileName}`;
        await fs.writeFile(this.getFileDir(fileName), file.buffer);
        type = file.mimetype;
        fileModels.push({
          url: fileUrl,
          name: fileUrl.split('/').pop(),
          type,
          fileSize: file.size,
        });
      }
      const payload = this.jwtServer.decode(headers.token);
      const userId = payload.id;
      const valid = await this.jwtServer.verifyAsync(headers.token);
      if (valid) {
        for (let index = 0; index < fileModels.length; index++) {
          const file = fileModels[index];

          await this.fileRepository.insert({
            ...file,
            userId,
          });
          const filesDir = path.resolve(
            process.env.STATIC_PUBLIC_DIR,
            './resources/assets',
          );
          pushCode(filesDir);
        }
        return fileModels.length > 1 ? fileModels : fileModels[0].url;
      }
      throw new BadRequestException('token失效');
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
