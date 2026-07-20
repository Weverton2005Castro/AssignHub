import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { randomUUID } from 'crypto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { id?: string }>();
    const requestId = (req.headers['x-request-id'] as string) ?? req.id ?? randomUUID();
    req.headers['x-request-id'] = requestId;

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in (data as object)) {
          const wrapped = data as { data: unknown; meta?: Record<string, unknown> };
          return {
            data: wrapped.data,
            meta: { requestId, ...wrapped.meta },
          };
        }
        return { data, meta: { requestId } };
      }),
    );
  }
}
