import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] } | null)
            ?.message ??
          (exception instanceof Error
            ? exception.message
            : 'Internal server error'));

    const stack =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    let dbErrorMessage: string | null = null;
    if (exception && typeof exception === 'object') {
      const errObj = exception as Record<string, unknown>;
      const originalError = errObj.original ?? errObj.parent;
      if (originalError) {
        if (originalError instanceof Error) {
          dbErrorMessage = originalError.message;
        } else if (typeof originalError === 'object') {
          const dbErrObj = originalError as Record<string, unknown>;
          dbErrorMessage =
            typeof dbErrObj.message === 'string'
              ? dbErrObj.message
              : JSON.stringify(originalError);
        } else {
          dbErrorMessage =
            typeof originalError === 'string' ||
            typeof originalError === 'number' ||
            typeof originalError === 'boolean'
              ? String(originalError)
              : JSON.stringify(originalError);
        }
      }
    }

    const logMessage = dbErrorMessage
      ? `${stack}\nOriginal/Parent Database Error: ${dbErrorMessage}`
      : stack;

    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      logMessage,
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
