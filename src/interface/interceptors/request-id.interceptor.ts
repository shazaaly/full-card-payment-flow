import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();

        const requestId = uuidv4();
        req.requestId = requestId;
        res.setHeader('X-Request-Id', requestId);

        return next.handle();
    }
}
