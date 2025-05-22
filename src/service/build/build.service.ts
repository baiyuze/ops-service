import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Build } from '../../entities/build.entity';
import { Queue } from '../../entities/queue.entity';
import { readdir } from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';
import type { BuildConfig } from './build.controller';
import { createTempScript, getScriptExt } from 'src/common/utils';
import * as dayjs from 'dayjs';
import type { VariableItemType } from '../workFlow/workFlow.controller';

interface NodeType {
  id: string;
  type: string;
  data: {
    nodeData: {
      id: string;
      name: string;
    };
    formData: {
      branch: string;
      variables: any[];
      environment: string;
      script: string;
    };
  };
}
@Injectable()
export class BuildService {
  constructor(
    @InjectRepository(Build)
    private buildRepository: Repository<Build>,
    @InjectRepository(Queue)
    private queueRepository: Repository<Queue>,
  ) {}
  /**
   * 获取需要创建的队列数据
   * @param buildConfig
   * @param body
   * @returns
   */
  getQueueData(
    buildConfig: Build,
    body: BuildConfig,
    edges: string = null,
    type: 'flow' | 'queue' = 'queue',
  ) {
    // 读取编译配置
    let buildScript = {
      content: body.script,
    };
    if (type === 'queue') {
      buildScript = buildConfig.buildScript.find(
        (item) => item.name === body.script,
      );
    }

    if (!buildScript) {
      throw new BadRequestException('未指定编译脚本');
    }
    const ext = getScriptExt(body.bash);
    const scriptFile = createTempScript(
      buildScript.content,
      ext,
      buildConfig.versionId,
    );
    const buildEnv = buildConfig.environmentConfig.find(
      (item) => body.environment === item.config?.value,
    );
    const variablesMap = {
      ...buildConfig.environmentVariables.map((item) => ({
        [item.key]: item.value,
      })),
    };

    const data: any = {
      branch: body.branch,
      variables: variablesMap,
      environment: buildEnv.config.value,
    };
    const queueData = {
      buildId: buildConfig.id,
      versionId: buildConfig.versionId,
      status: 0,
      type: type === 'flow' ? 1 : 0,
      buildConfig: JSON.stringify({
        scriptFile,
        params: { projectId: buildConfig.versionId, id: buildConfig.id },
        data,
      }),
      buildLogName: `build.${dayjs().format('YYYYMMDDHHmmss')}.log`,
      name: data.branch,
      branch: data.branch,
      edges,
    };
    return queueData;
  }

  /**
   * 生成配置
   * @param buildConfig
   * @param body
   * @returns
   */
  async createQueue(build: Build, body: BuildConfig) {
    const queueData = this.getQueueData(build, body);
    return this.queueRepository.insert(queueData);
  }
  /**
   * 将workFlow内容存入队列表中
   */
  async createFlowQueue({
    queue,
    edges,
    variableData,
    workflowId,
  }: {
    queue: any[];
    edges: any[];
    workflowId: number;
    variableData: VariableItemType[];
  }) {
    const nodes = queue.reverse();
    // const node: NodeType = queue.pop();
    for (let index = 0; index < nodes.length; index++) {
      const node = queue[index];
      const versionId = node.data.nodeData.id;
      const build = await this.buildRepository.findOne({
        where: {
          versionId,
        },
      });
      const formData = node.data.formData;
      variableData.forEach((item) => {
        formData.branch = formData.branch.replaceAll(
          '${' + item.key + '}',
          item.value,
        );
      });

      const queueData = this.getQueueData(
        build,
        formData,
        JSON.stringify(edges),
        'flow',
      );
      await this.queueRepository.insert(queueData);
    }
  }

  async create(buildData: Partial<Build>) {
    const data = await this.buildRepository.findOne({
      where: { id: buildData.id },
    });
    if (data) return this.buildRepository.update(buildData.id, buildData);
    delete buildData.id;
    return this.buildRepository.insert(buildData);
  }

  async findAll(): Promise<Build[]> {
    // const queue = await this.buildQueueRepository.find();
    // console.log(queue);
    return await this.buildRepository.find();
  }
  /**
   * 根据ID获取特定的构建配置
   * @param id - 构建配置的ID
   * @returns 返回指定ID的构建配置对象
   * @throws NotFoundException 当找不到指定ID的配置时抛出异常
   */
  async findBuildOne(id: number): Promise<Build | null> {
    try {
      return await this.buildRepository.findOne({ where: { id: id } });
    } catch (error) {
      throw new NotFoundException(`未找到ID为 ${id} 的构建配置`);
    }
  }
  /**
   * 根据版本ID获取特定的构建配置
   * @param id - 版本ID
   * @returns 返回指定ID的构建配置对象
   * @throws NotFoundException 当找不到指定ID的配置时抛出异常
   */
  async findOne(id: number): Promise<Build | null> {
    try {
      return await this.buildRepository.findOne({ where: { versionId: id } });
    } catch (error) {
      throw new NotFoundException(`未找到ID为 ${id} 的构建配置`);
    }
  }
  /**
   * 更新构建配置
   * @param id - 构建配置的ID
   * @param data - 更新后的构建配置数据
   * @returns 返回更新后的构建配置对象
   */
  async update(id: number, data: Partial<Build>) {
    return await this.buildRepository.update(id, data);
  }

  // 获取文件目录
  async getFiles(versionId: string, dirPath?: string) {
    const basePath = path.resolve(process.env.NAMESPACE, versionId);
    const targetPath = dirPath ? path.resolve(basePath, dirPath) : basePath;

    // 验证目标路径是否在允许的范围内（防止目录遍历攻击）
    if (!targetPath.startsWith(basePath)) {
      throw new Error('Invalid path');
    }

    const files = await readdir(targetPath);
    const fileList = await Promise.all(
      files.map(async (file) => {
        const filePath = path.resolve(targetPath, file);
        const stat = await fs.promises.stat(filePath);
        const relativePath = path.relative(basePath, filePath);
        const data = {
          createTime: stat.ctime,
          birthTime: stat.birthtime,
          updateTime: stat.mtime,
          size: stat.size,
        };
        return {
          ...data,
          name: file,
          path: relativePath, // 返回相对路径
          type: stat.isDirectory() ? 'dir' : 'file',
          isDirectory: stat.isDirectory(),
          parentId: versionId,
        };
      }),
    );

    return fileList.filter((file) => {
      if (file.name.includes('.temp')) return false;
      if (/^build\.\d+\.log$/.test(file.name)) return false;
      return true;
    });
  }

  async downloadFile(versionId: string, name: string) {
    const filePath = path.resolve(process.env.NAMESPACE, versionId, name);
    return fs.createReadStream(filePath);
  }
}
