import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { sha256 } from '../../common/utils';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async selectUserAccount(account: string, type?: boolean) {
    const userInfo: User = await this.userRepository.findOne({ account });
    if (!userInfo) return false;
    return true;
  }

  insertUserInfo(data) {
    return this.userRepository.insert(data);
  }

  async signInGetToken(body) {
    const psd = sha256(body.password);
    // 验证账号密码是否正确，生成token和返回用户信息
    const userInfo: User = await this.userRepository.findOne({
      account: body.account,
      password: psd,
    });
    if (userInfo) {
      const payload = {
        id: userInfo.id,
        name: userInfo.name,
        account: userInfo.account,
      };
      const token = this.jwtService.sign(payload);
      if (userInfo.password) {
        delete userInfo.password;
      }
      return {
        token,
        userInfo,
      };
    } else {
      throw new BadRequestException('账号不存在，请重试');
    }
  }
}
