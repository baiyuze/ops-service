import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('char', {
    length: 30,
  })
  name: string;

  @Column('int')
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('text')
  url: string;

  @Column('char', {
    length: 30,
  })
  type: string;

  @Column('int')
  fileSize: Number;
  @CreateDateColumn({
    name: 'create_time',
  })
  createTime?: string;

  @UpdateDateColumn({
    name: 'update_time',
  })
  updateTime?: string;
}
