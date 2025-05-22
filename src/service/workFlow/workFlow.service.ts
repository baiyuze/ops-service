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
import { WorkFlow } from 'src/entities/workFlow.entity';
import type { PageParams, VariableItemType } from './workFlow.controller';
import { FlowService } from '../flow/flow.service';
import { Flow } from 'src/entities/flow.entity';
import { Build } from 'src/entities/build.entity';
import { BuildService } from '../build/build.service';
// import { cloneCode } from 'src/common/pool';

@Injectable()
export class WorkFlowService {
  private readonly logger = new Logger(WorkFlowService.name);
  constructor(
    @InjectRepository(WorkFlow)
    private repository: Repository<WorkFlow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtServer: JwtService,
    private readonly flowService: FlowService,
    private readonly buildService: BuildService,
  ) {}

  async findAll(query: PageParams) {
    const num = query.pageNum < 1 ? 1 : query.pageNum || 1;
    const skip = (num - 1) * (query.pageSize || 20);
    const pageSize = query.pageSize;
    const queryBuilder = this.repository
      .createQueryBuilder('workFlow')
      .leftJoinAndSelect('workFlow.user', 'user')
      .select(['workFlow', 'user.name', 'user.id'])
      .skip(skip)
      .take(pageSize)
      .orderBy('workFlow.createTime', 'DESC');

    if (query.name) {
      queryBuilder.where('workFlow.name like :name', {
        name: `%${query.name}%`,
      });
    }

    const count = await queryBuilder.getCount();
    const data = await queryBuilder.getMany();

    return {
      total: count,
      list: data,
      pageNum: num,
      pageSize: pageSize,
    };
  }

  async findOne(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async insert(body: WorkFlow, headers: CurrentHeaderType) {
    const payload = this.jwtServer.decode(headers.token);
    const user = await this.userRepository.findOne({
      where: { id: payload.id },
    });

    const workFlowEntity = await this.repository.create({
      ...body,
      userId: user.id,
    });
    const workFlow = await this.repository.save(workFlowEntity);
    const flow = await this.flowService.createFlowData({
      workFlowId: workFlow.id,
      flowConfig: JSON.stringify({}),
    } as Flow);

    return this.repository.update(workFlow.id, {
      flowId: flow.id,
    });
  }

  async update(id: number, body: WorkFlow) {
    return this.repository.update(id, body);
  }
  /**
   * 更新变量
   * @param id
   * @param body
   * @returns
   */
  async updateVariable(id: number, body: WorkFlow['variable']) {
    return this.repository.update(id, {
      variable: body,
    });
  }

  async delete(id: number) {
    try {
      const workFlow = await this.repository.findOne({
        where: { id },
        relations: ['flow'],
      });

      if (!workFlow) {
        throw new BadRequestException('工作流不存在');
      }

      await this.repository.manager.transaction(
        async (transactionalEntityManager) => {
          if (workFlow.flow) {
            // 先解除 WorkFlow 和 Flow 的关联
            await transactionalEntityManager
              .createQueryBuilder()
              .update(WorkFlow)
              .set({ flowId: null })
              .where('id = :id', { id: workFlow.id })
              .execute();

            // 然后删除 Flow
            await transactionalEntityManager
              .createQueryBuilder()
              .delete()
              .from(Flow)
              .where('id = :id', { id: workFlow.flow.id })
              .execute();
          }

          // 最后删除 WorkFlow
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from(WorkFlow)
            .where('id = :id', { id: workFlow.id })
            .execute();
        },
      );

      return { success: true };
    } catch (error) {
      this.logger.error(`删除工作流失败: ${error.message}`);
      throw new BadRequestException('删除工作流失败');
    }
  }

  getRelationMap(flowConfig) {
    const nodes = flowConfig.nodes || [];
    const edges = flowConfig.edges || [];
    const nodeMap = {};
    const edgeMap = {};
    nodes.forEach((item) => {
      nodeMap[item.id] = item;
    });
    edges.forEach((item) => {
      edgeMap[item.id] = item;
    });
    return {
      nodeMap,
      edgeMap,
    };
  }

  async startWorkFlow(id: number, variableData: VariableItemType[]) {
    // 把工作流的数据解析，然后丢入队列服务中去等待执行。
    // 执行完成后，更新workflow表的状态
    const res = await this.repository.findOne(id, { relations: ['flow'] });
    const flow = res.flow;
    if (flow) {
      // 获取关联关系
      const flowConfig = flow.flowConfig as any;
      try {
        const edges = flowConfig.edges || [];
        const { nodeMap, edgeMap } = this.getRelationMap(flowConfig);
        const START = 'start';
        const END = 'end';
        const queue = [];
        const startEdge = edges.find((item) => item.sourceHandle === START);
        let currentNode = START;
        let currentEdge = startEdge.id;
        while (currentNode !== END && currentEdge) {
          const edge = edgeMap[currentEdge];

          currentNode = edge.target;

          currentEdge = edges.find((item) => item.source === currentNode)?.id;
          if (nodeMap[currentNode].type !== END) {
            queue.unshift(nodeMap[currentNode]);
          }
        }
        this.analysisFormData({
          id,
          queue,
          edges,
          variableData,
        });
      } catch (error) {
        this.logger.error(error);
      }
    }
  }
  /**
   * 解析formData，处理全局变量
   */
  async analysisFormData({
    queue,
    edges,
    variableData,
    id,
  }: {
    queue: any[];
    edges: any[];
    variableData: VariableItemType[];
    id: number;
  }) {
    // const
    // 解析后，存入队列数据
    await this.buildService.createFlowQueue({
      workflowId: id,
      queue,
      edges,
      variableData,
    });
    await this.repository.update(id, {
      status: 1,
    });
  }
}
