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

/**
 * 构建队列
 */
@Entity()
export class Queue {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 关联的buildID
   */
  @Column('int')
  buildId: number;

  /**
   * 关联的buildID
   */
  @Column('int')
  versionId: number;

  @ManyToOne(() => Build, { eager: false })
  @JoinColumn({ name: 'buildId', referencedColumnName: 'id' })
  build: Build;

  @ManyToOne(() => Version, { eager: false })
  @JoinColumn({ name: 'versionId', referencedColumnName: 'id' })
  version: Version;

  // /**
  //  * 项目名称
  //  */
  // @Column('char', {
  //   default: null,
  //   length: 255,
  //   comment: '项目名称',
  //   name: 'versionName',
  // })
  // versionName: string;
  /**
   * 构建队列状态
   */
  @Column('tinyint', {
    default: 0,
    comment: '0: 未开始, 1: 进行中, 2: 已完成, 3: 失败, 4: 停止',
  })
  status: number;

  @Column('tinyint', {
    default: 0,
    comment: '0: 队列, 1: flow',
  })
  type: number;
  /**
   * 构建队列名称
   */
  @Column('char', {
    default: null,
    length: 255,
    comment: '构建队列名称',
  })
  name: string;

  /**
   * 构建分支
   */
  @Column('char', {
    default: null,
    length: 255,
    comment: '构建分支',
  })
  branch: string;

  /**
   * 构建配置
   */
  @Column('text', {
    default: null,
  })
  buildConfig: string;
  /**
   * 边数据
   */
  @Column('json', {
    default: null,
    nullable: true,
  })
  edges: string;
  /**
   * 构建日志名称
   */
  @Column('char', {
    default: null,
    length: 255,
  })
  buildLogName: string;
  /**
   * 构建队列开始时间
   */
  @Column('datetime', {
    default: null,
    name: 'start_time',
  })
  startTime: Date;

  /**
   * 构建队列结束时间
   */
  @Column('datetime', {
    default: null,
    name: 'end_time',
  })
  endTime: Date;

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
