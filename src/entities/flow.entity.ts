import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Build } from './build.entity';
import { Version } from './version.entity';
import { WorkFlow } from './workFlow.entity';

/**
 * 构建队列
 */
@Entity()
export class Flow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('tinyint', {
    default: 0,
    comment: '0: 未开始, 1: 进行中, 2: 已完成, 3: 失败',
  })
  status: number;

  /**
   * 关联的工作流ID
   */
  @Column('int')
  workFlowId: number;

  /**
   * 工作流配置
   */
  @Column('json', {
    default: null,
  })
  flowConfig: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({
    name: 'create_time',
  })
  createTime: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({
    name: 'update_time',
  })
  updateTime: Date;
}
