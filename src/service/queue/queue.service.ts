import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from '../../entities/queue.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { actionTempScript, buildStopWork } from 'src/common/utils';
import { BuildService } from '../build/build.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Queue)
    private queueRepository: Repository<Queue>,
    private buildService: BuildService,
  ) {}
  logger = new Logger(QueueService.name);
  queue: Queue[] = [];
  running: boolean = false;

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    if (this.running) return;

    if (!this.queue.length) {
      const queue = await this.queueRepository.find({
        where: { status: 0 },
        order: { createTime: 'ASC' },
      });
      this.queue = queue;
    } else {
      const buildData = this.getBuildData();

      this.start(buildData);
    }
  }
  /**
   * 获取队列中的第一个构建数据
   * @returns
   */
  getBuildData() {
    const buildData = this.queue[0];

    if (buildData) {
      this.running = true;
    }
    return buildData;
  }

  async start(buildData: Queue) {
    try {
      this.updateStatus(buildData.id, 1);
      const buildConfig = JSON.parse(buildData.buildConfig);
      const { scriptFile, params, data } = buildConfig;
      const { projectId, id } = params;
      actionTempScript({
        params: {
          scriptFile,
          projectId,
          id,
          data,
          queueId: buildData.id,
          buildLogName: buildData.buildLogName,
        },
        queueService: this,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * 处理节点条件
   * todo...
   */
  handleCondition(lastNodeData, nextNodeData): boolean {
    return true;
  }
  /**
   * 更新队列，更新running状态
   * @param running
   */
  async updateRunning(running: boolean = false) {
    // 只有执行完成一个配置，才会删除这个队列数据
    const completeBuildData = this.queue.shift();
    this.logger.log('======结束一个======', `ID: ${completeBuildData.id}`);
    const buildData = this.queue[0];
    // 判断是否是工作流

    if (completeBuildData.type === 1) {
      const check = this.handleCondition(completeBuildData, buildData);
      if (check) {
        this.nextQueueStatus(buildData, running);
      } else {
        // 将状态变更为失败
        // 需要遍历数据中所有的相关的数据，将其设为失败，其他的正常执行。需要区分id
        // todo...
        this.queueRepository.update(buildData.id, {
          status: 3,
        });
      }
    } else {
      this.nextQueueStatus(buildData, running);
    }
  }
  nextQueueStatus(buildData: Queue, running: boolean) {
    if (buildData) {
      this.start(buildData);
    } else {
      this.running = running;
    }
  }
  // 停止队列
  async stop(id: number): Promise<string | Error> {
    const bool = await buildStopWork(Number(id));
    if (bool) {
      this.logger.log('queue' + id + '已停止');
      return '停止成功';
    }
    throw new BadRequestException('停止失败');
  }

  // 创建队列
  async create(queueData: Partial<Queue>) {
    return this.queueRepository.insert(queueData);
  }

  // 获取所有队列，支持分页
  async findAll(options?: {
    pageNum?: number;
    pageSize?: number;
    status?: number;
    buildId?: number;
    versionId?: number;
  }): Promise<{ items: Queue[]; total: number }> {
    const query = this.queueRepository
      .createQueryBuilder('queue')
      .leftJoinAndSelect('queue.version', 'version')
      .orderBy('queue.createTime', 'DESC');

    if (options?.status !== undefined) {
      query.andWhere('queue.status = :status', { status: options.status });
    }

    if (options?.buildId) {
      query.andWhere('queue.buildId = :buildId', { buildId: options.buildId });
    }
    if (options?.versionId) {
      query.andWhere('queue.versionId = :versionId', {
        versionId: options.versionId,
      });
    }

    const take =
      options?.pageSize && options.pageSize < 10000
        ? options.pageSize
        : undefined;

    const skip = take ? ((options?.pageNum || 1) - 1) * take : 0;

    if (take) {
      query.skip(skip).take(take);
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  // 获取单个队列
  async findOne(id: number): Promise<Queue> {
    return await this.queueRepository.findOne({
      where: { id },
      relations: ['build'],
    });
  }

  // 更新队列
  async update(id: number, queueData: Partial<Queue>): Promise<Queue> {
    await this.queueRepository.update(id, queueData);
    return await this.findOne(id);
  }

  // 删除队列
  async remove(id: number): Promise<void> {
    await this.queueRepository.delete(id);
  }

  // 更新队列状态
  async updateStatus(id: number, status: number): Promise<void> {
    await this.queueRepository.update(id, { status });
  }

  // 开始构建
  async startBuild(id: number) {
    // const now = new Date();
    // return await this.update(id, {
    //   status: 1, // 进行中
    //   startTime: now,
    // });
  }

  // 完成构建
  async completeBuild(id: number, success: boolean): Promise<Queue> {
    const now = new Date();
    return await this.update(id, {
      status: success ? 2 : 3, // 2: 已完成, 3: 失败
      endTime: now,
    });
  }

  // 获取待处理的队列
  async getPendingQueues(): Promise<Queue[]> {
    return await this.queueRepository.find({
      where: { status: 0 }, // 未开始的队列
      order: { createTime: 'ASC' },
    });
  }
}
