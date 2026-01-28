import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  success: false;
  message: string;
  data: null;
  statusCode: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, message } = this.normalizeException(exception);

    if (statusCode >= 500) {
      this.logger.error(
        typeof exception === 'object' && exception !== null && 'stack' in exception
          ? (exception as Error).stack
          : String(exception),
      );
    }

    const body: ErrorResponse = {
      success: false,
      message,
      data: null,
      statusCode,
    };

    response.status(statusCode).json(body);
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    message: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && res !== null && 'message' in res
          ? Array.isArray((res as { message: unknown }).message)
            ? ((res as { message: string[] }).message as string[]).join(', ')
            : String((res as { message: string }).message)
          : exception.message;
      return { statusCode: status, message };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
