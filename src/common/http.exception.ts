import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const code = exception.getStatus();
    const msg = exception.message;
    const url = request.originalUrl;
    const timestamp = new Date().toISOString();
    // 整理返回全部的错误信息
    const errorResponse = {
      msg, // 错误提示
      data: [], // 默认结果为空数组
      code, // 自定义code
      timestamp,
      url, // 错误的url地址
    };

    // http状态码响应，没有就是500
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(200);
    response.header("Content-Type", "application/json; charset=utf-8");
    this.logger.error('url:', request.originalUrl, 'method:', request.method, 'errorResponse:', errorResponse);
    response.send(errorResponse);
  }
}
