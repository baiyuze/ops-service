import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { User } from '../../entities/user.entity';
import { TokenExpires } from '../../common/auth/entities/tokenExpires.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [TypeOrmModule.forFeature([User, TokenExpires]), PassportModule],
  controllers: [LoginController],
  providers: [LoginService, JwtStrategy],
})
export class LoginModule {}
