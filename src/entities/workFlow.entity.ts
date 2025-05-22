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
import { Flow } from './flow.entity';
import { User } from './user.entity';

/**
 * 构建队列
 */
@Entity()
export class WorkFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('tinyint', {
    default: 0,
    comment: '0: 未开始, 1: 进行中, 2: 已完成, 3: 失败',
  })
  status: number;

  /**
   * 工作流名称
   */
  @Column('char', {
    default: null,
    length: 255,
    comment: '工作流名称',
  })
  name: string;

  /**
   * 工作流描述
   */
  @Column('char', {
    default: null,
    length: 255,
    comment: '工作流描述',
    nullable: true,
  })
  description: string;
  /**
   * 工作流变量
   */
  @Column('json', {
    default: null,
    comment: '工作流全局变量',
    nullable: true,
  })
  variable: string;

  /**
   * 创建人
   */
  @Column('int')
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * 关联的flowID
   */
  @Column('int', {
    default: null,
    nullable: true,
  })
  flowId: number;

  /**
   * 工作流配置
   */
  @OneToOne(() => Flow)
  @JoinColumn({ name: 'flowId' })
  flow: Flow;

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
