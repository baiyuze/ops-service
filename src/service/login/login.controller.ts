import {
  Body,
  Controller,
  Post,
  Get,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { LoginService } from './login.service';
import { Validator } from '../../common/decorator/validator.decorator';
import { sha256 } from '../../common/utils';
import { JwtAuthGuard } from '../../common/auth/jwtAuth.guard';
@Controller('api/user')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}
  /**
   * 登录后，生成token
   */
  @Post('login')
  @Validator([
    {
      reg: /^[a-z0-9_-]{1,18}$/,
      key: 'account',
      msg: 'account需为1-18位的字母或数字,可以为_-',
      required: true,
    },
    {
      reg: /^[a-z0-9_-]{6,18}$/,
      key: 'password',
      msg: 'password需为6-18位的字母或数字,可以为_-',
      required: true,
    },
  ])
  async signIn(@Body() body: User) {
    return await this.loginService.signInGetToken(body);
  }

  @Post('reg')
  @Validator([
    { key: 'name', msg: 'name不能为空', required: true },
    {
      reg: /^[a-z0-9_-]{1,18}$/,
      key: 'account',
      msg: 'account需为1-18位的字母或数字,可以为_-',
      required: true,
    },
    {
      reg: /^[a-z0-9_-]{1,18}$/,
      key: 'password',
      msg: 'password需为6-18位的字母或数字,可以为_-',
      required: true,
    },
    {
      reg: /^(13[0-9]|14[579]|15[0-3,5-9]|16[6]|17[0135678]|18[0-9]|19[89])\d{8}$/,
      key: 'phone',
      msg: '手机号格式错误',
    },
    {
      reg: /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/,
      key: 'email',
      msg: '邮箱格式错误',
    },
  ])
  async registerAccount(@Body() body: User) {
    const { name, password, phone = null, email = null, account } = body;
    const hasSameAccount = await this.loginService.selectUserAccount(account);
    if (hasSameAccount)
      throw new BadRequestException('账号已存在，请更换后重试');
    const psd = sha256(password);
    const data: User = {
      name,
      password: psd,
      phone,
      account,
      role: null,
      createTime: String(Date.now()),
    };
    if (phone) data.phone = phone;
    if (email) data.email = email;
    try {
      await this.loginService.insertUserInfo(data);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  // 校验是否登录装饰器
  @UseGuards(JwtAuthGuard)
  @Get('test')
  async test(@Request() req) {
    return '测试';
  }
}
