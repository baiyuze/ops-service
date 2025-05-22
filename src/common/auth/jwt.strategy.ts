import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoginService } from '../../service/login/login.service';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenExpires } from './entities/tokenExpires.entity';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TokenExpires)
    private tokenRepository: Repository<TokenExpires>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('token'),
      ignoreExpiration: true,
      secretOrKey: 'dev_ops',
    });
  }

  async getUser(user): Promise<User> {
    const userInfo: User = await this.userRepository.findOne(user);
    return userInfo;
  }
  /**
   * 更新过期时间
   * @param userTokenInfo
   */
  async insertTokenExp(userTokenInfo: TokenExpires) {
    try {
      const tokenExp: TokenExpires = await this.getUserTokenExp(userTokenInfo);
      userTokenInfo.lasterTime = String(Date.now());
      if (tokenExp) {
        await this.tokenRepository.update(tokenExp.id, userTokenInfo);
      } else {
        await this.tokenRepository.insert(userTokenInfo);
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getUserTokenExp(userToken: TokenExpires) {
    try {
      const tokenExp = await this.tokenRepository.findOne(userToken);
      return tokenExp;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  /**
   * token过期删除token
   * @param userToken
   */
  async hasExpFunc(userToken?: TokenExpires) {
    // 删除过期token
    userToken && (await this.tokenRepository.remove(userToken));
    throw new UnauthorizedException('token过期，请重新登录');
  }

  // 校验token是否过期，同时刷新token
  async validate(payload: any) {
    const user = {
      id: payload.id,
      name: payload.name,
      account: payload.account,
    };
    const userExp = {
      userId: payload.id,
      userName: payload.name,
    };
    const exp = payload.exp * 1000;
    if (Date.now() >= exp - 5 * 60 * 1000 && Date.now() <= exp) {
      await this.insertTokenExp(userExp);
    }
    if (Date.now() >= exp) {
      // 先查询数据库中是否过期
      const tokenExp: TokenExpires = await this.getUserTokenExp(userExp);
      if (!tokenExp) return this.hasExpFunc();
      if (
        tokenExp &&
        Date.now() - Number(tokenExp.lasterTime) >= 24 * 60 * 60 * 1000
      )
        return this.hasExpFunc(tokenExp);
      await this.insertTokenExp(userExp);
    }
    const userInfo = await this.getUser(user);
    if (userInfo) {
      delete userInfo.password;
      return userInfo;
    }
    return false;
  }
}
