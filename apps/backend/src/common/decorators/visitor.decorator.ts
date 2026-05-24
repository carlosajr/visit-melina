import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { VisitorPayload } from '../guards/visitor-jwt.guard';

export const Visitor = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): VisitorPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { visitor: VisitorPayload }>();
    return req.visitor;
  },
);
