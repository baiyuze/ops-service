
import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('token_expires')
export class TokenExpires {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('char', {
    length: 30,
  })
  userId: number;

  @Column('char', {
    length: 30,
    name: 'laster_time'
  })
  lasterTime?: string;

  @Column('varchar', {
    length: 255,
    name: 'user_name'
  })
  userName: string;
}