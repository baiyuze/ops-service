import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('char', {
    length: 30,
  })
  name: string;

  @Column('char', {
    length: 30,
  })
  account: string;

  @Column('char', {
    length: 30,
    name: 'create_time',
  })
  createTime?: string;

  @Column()
  password: string;

  @Column({
    nullable: true,
    length: 10,
  })
  role: string;

  @Column('char', {
    length: 30,
    nullable: true,
  })
  phone?: string;

  @Column('char', {
    length: 100,
    nullable: true,
  })
  email?: string;

  @UpdateDateColumn({
    name: 'update_time',
  })
  updateTime?: string;
}
