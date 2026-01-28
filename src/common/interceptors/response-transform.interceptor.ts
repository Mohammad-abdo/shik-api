import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface UnifiedResponse<T> {
  success: true;
  message: string;
  data: T;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, UnifiedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<UnifiedResponse<T>> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'success' in payload && 'message' in payload && 'data' in payload) {
          return payload as UnifiedResponse<T>;
        }
        const method = req.method;
        const message = this.getDefaultMessage(method);
        return {
          success: true,
          message,
          data: payload ?? {},
        } as UnifiedResponse<T>;
      }),
    );
  }

  private getDefaultMessage(method: string): string {
    const messages: Record<string, string> = {
      GET: 'Request completed successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };
    return messages[method] ?? 'Request completed successfully';
  }
}
