import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { Version } from '../../entities/version.entity';
import { JwtService } from '@nestjs/jwt';
import { CurrentHeaderType, Page } from '../file/types';
import { User } from 'src/entities/user.entity';
import * as fs from 'fs-extra';
import * as path from 'path';
import { cloneBranch } from 'src/common/utils';
import { DynamicThreadPool, availableParallelism } from 'poolifier';
import { handlerPool } from 'src/common/pool';
import { LoggerMiddleware } from 'src/middleware/logger.middleware';
// import { cloneCode } from 'src/common/pool';
const slash = require('slash');

@Injectable()
export class VersionService {
  private readonly logger = new Logger(LoggerMiddleware.name);
  constructor(
    @InjectRepository(Version)
    private repository: Repository<Version>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtServer: JwtService,
  ) {}

  // findAll(): Promise<Version[]> {
  //   return this.repository.find();
  // }

  async findAll(query: Page, headers: CurrentHeaderType) {
    const num = query.pageNum < 1 ? 1 : query.pageNum || 1;
    const skip = (num - 1) * (query.pageSize || 20);
    const pageSize = query.pageSize;
    const payload = this.jwtServer.decode(headers.token);
    const currentUserId = payload.id;

    const queryBuilder = await this.repository
      .createQueryBuilder('version')
      .orderBy('version.createTime', 'DESC')
      .leftJoinAndSelect('version.user', 'user')
      .select(['version', 'user.name']);

    if (query.name) {
      queryBuilder.where('version.name like :name', {
        name: `%${query.name}%`,
      });
    }

    if (pageSize) {
      queryBuilder.take(pageSize).skip(skip);
    }
    const data = await queryBuilder.getMany();
    // 过滤其他用户的 gitUrl
    const filteredData = data.map((item) => {
      if (item.userId !== currentUserId) {
        const { gitUrl, ...rest } = item;
        return rest;
      }
      return item;
    });

    const count = await this.repository.count();
    return {
      total: count,
      list: filteredData,
      pageNum: num,
      pageSize: count,
    };
  }

  findOne(id: string): Promise<Version> {
    // SELECT id,xx,xx from test WHERE id=xx;
    return this.repository.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    // 删除文件夹namespace/
    const namespace = process.env.NAMESPACE;
    await fs.remove(path.resolve(slash(`${namespace}/${id}`)));
  }

  async update(body: Version): Promise<void> {
    const payload: {
      name: string;
      description: string;
      gitUrl?: string;
    } = {
      name: body.name,
      description: body.description,
    };
    if (body.gitUrl) {
      payload.gitUrl = body.gitUrl;
    }
    await this.repository.update(body.id, payload);
  }
  getCurrentPath(id: number) {
    const namespace = process.env.NAMESPACE;
    return path.resolve(slash(`${namespace}/${id}`));
  }
  async createNamespace(id: number) {
    await fs.ensureDir(this.getCurrentPath(id));
  }
  async cloneBranch(id: number) {
    const config = await this.repository.findOne({ where: { id } });
    try {
      const response = await handlerPool.execute(
        {
          gitUrl: config.gitUrl,
          currentPath: this.getCurrentPath(id),
        },
        'clone',
      );
      if (response instanceof Error) {
        this.repository.update(id, { status: 2 });
        this.logger.error(response);
      } else {
        this.logger.log('克隆成功');
        this.repository.update(id, { status: 1 });
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
  async insert(body: Version, headers: CurrentHeaderType): Promise<string> {
    const payload = this.jwtServer.decode(headers.token);
    const userId = payload.id;

    const data: InsertResult = await this.repository.insert({
      ...body,
      userId,
    });
    const id = data.identifiers[0].id;
    // 创建文件夹namespace/
    await this.createNamespace(id);
    // 拉取代码分支
    this.cloneBranch(id);
    return '创建成功';
  }
}
