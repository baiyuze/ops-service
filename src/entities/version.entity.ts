import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Version {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('char', {
    length: 30,
  })
  name: string;

  @Column('int')
  userId: number;

  @Column('tinyint', {
    name: 'status',
    default: 0,
    comment: '状态, 0:初始化状态, 1:克隆成功, 2:克隆失败',
  })
  status: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('text', {
    nullable: true,
  })
  gitUrl: string;

  @Column('char', {
    name: 'description',
    default: null,
    length: 255,
  })
  description: string;

  @CreateDateColumn({
    name: 'create_time',
  })
  createTime?: string;

  @UpdateDateColumn({
    name: 'update_time',
  })
  updateTime?: string;
}
