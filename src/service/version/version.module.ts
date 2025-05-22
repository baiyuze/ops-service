import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionService } from './version.service';
import { VersionController } from './version.controller';
import { Version } from '../../entities/version.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Version, User])],
  providers: [VersionService],
  controllers: [VersionController],
})
export class VersionModule {}
