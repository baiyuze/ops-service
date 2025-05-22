import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { TokenExpires } from '../../common/auth/entities/tokenExpires.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { File } from '../../entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, TokenExpires, User])],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
