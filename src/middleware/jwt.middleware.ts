import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * 身份验证jwt
 */
@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtMiddleware.name);
  private readonly jwtService: JwtService

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.get('token');
    const a = this.jwtService.decode(token);
    console.log(a, '=1=212');
    // console.log(a, '=1=1');
    // const json = (v) => JSON.stringify(v);
    // this.logger.log(`url: ${req.url} method: ${req.method}, query: ${json(req.query)}, body: ${json(req.body)}, params: ${json(req.params)} IP: ${req.ip}`);
    next();
  }
}
