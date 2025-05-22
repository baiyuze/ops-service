import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { CurrentHeaderType, Page } from '../file/types';
import { Flow } from 'src/entities/flow.entity';
// import { cloneCode } from 'src/common/pool';

interface FlowQuery extends Page {
  workFlowId: number;
}
@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);
  constructor(
    @InjectRepository(Flow)
    private repository: Repository<Flow>,
  ) {}

  async findAll(query: FlowQuery, headers: CurrentHeaderType) {
    const num = query.pageNum < 1 ? 1 : query.pageNum || 1;
    const skip = (num - 1) * (query.pageSize || 20);
    const pageSize = query.pageSize;
    const workFlowId = query.workFlowId;
    const queryBuilder = this.repository
      .createQueryBuilder('flow')
      .skip(skip)
      .take(pageSize)
      .orderBy('flow.createTime', 'DESC');

    if (workFlowId) {
      queryBuilder.where('flow.workFlowId = :workFlowId', { workFlowId });
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

  async delete(id: number) {
    return this.repository.delete(id);
  }
  /**
   * 创建流程数据
   * @param body
   * @returns
   */
  async createFlowData(body: Flow) {
    const flow = this.repository.create(body);
    return this.repository.save(flow);
  }

  /**
   * 更新流程
   * @param body
   * @returns
   */
  async updateFlowData(body: Flow) {
    const id = body.id;
    delete body.id;
    const data = {
      ...body,
    };
    return this.repository.update(id, data);
  }

  async getFlowData(id: number) {
    return this.repository.findOne({ where: { id } });
  }
}
