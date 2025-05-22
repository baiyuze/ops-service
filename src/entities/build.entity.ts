import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Version } from './version.entity';

@Entity()
export class Build {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 关联的版本ID
   */
  @Column()
  versionId: number;

  @OneToOne(() => Version)
  @JoinColumn({ name: 'versionId' })
  version: Version;

  /**
   * 环境变量配置
   */
  @Column({ type: 'json', nullable: true })
  environmentVariables: {
    key: string;
    value: string;
  }[];

  /**
   * 环境配置信息
   */
  @Column({ type: 'json', nullable: true })
  environmentConfig: {
    name: string;
    description?: string;
    config: Record<string, any>;
  }[];

  /**
   * 构建脚本配置
   */
  @Column({ type: 'json' })
  buildScript: {
    name: string;
    description?: string;
    content: string;
  }[];
  @Column('tinyint', {
    name: 'status',
    default: 0,
    comment: '状态, 0:初始化状态, 1:正在构建, 2:构建成功, 3:构建失败',
  })
  status: number;
  /**
   * 是否激活
   */
  @Column({ default: true })
  isActive: boolean;

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
