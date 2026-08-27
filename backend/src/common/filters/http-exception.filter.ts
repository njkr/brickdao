import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Normalizes every error response to `{ statusCode, message, path, timestamp }`
 * and makes sure unexpected (non-HttpException) errors never leak an internal
 * stack trace or message to the client — they're logged server-side instead.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Something went wrong.';
    if (isHttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (isRecordWithMessage(body)) {
        message = body.message;
      } else {
        message = exception.message;
      }
    }

    if (!isHttpException) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

function isRecordWithMessage(
  value: unknown,
): value is { message: string | string[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    (typeof value.message === 'string' || Array.isArray(value.message))
  );
}
