import {
  CanActivate,
  ExecutionContext,
  Injectable,
  createParamDecorator,
  BadRequestException,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { SetMetadata, UseGuards } from '@nestjs/common';

@Injectable()
class ValiDatorData implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const validatorData: any = this.reflector.get<string[]>(
      'dataCheck',
      context.getHandler(),
    );
    // 统一校验
    for (let i = 0; i < validatorData.length; i++) {
      const validator = validatorData[i];
      const val: string | number = request.body[validator.key];
      if (validator.required && !val) {
        throw new BadRequestException(`${validator.key}不能为空`);
      } else if (val) {
        if (validator.reg && !(validator.reg instanceof RegExp))
          throw new BadRequestException('请传入正确的正则表达式');
        if (!val && !validator.reg && validator.msg)
          throw new BadRequestException(validator.msg);
        if (!validator.key || !validator.msg)
          throw new BadRequestException('请传入key,msg');
        if (validator.reg && !validator.reg.test(val))
          throw new BadRequestException(validator.msg);
      }
    }
    return true;
  }
}

export function Validator(data: any[] = []) {
  return applyDecorators(
    SetMetadata('dataCheck', data),
    UseGuards(ValiDatorData),
  );
}
