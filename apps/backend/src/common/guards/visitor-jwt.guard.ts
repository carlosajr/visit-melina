import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface VisitorPayload {
  sub: string; // whatsappDigits
  role: 'visitor';
  agendamentoId?: string;
}

@Injectable()
export class VisitorJwtGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { visitor: VisitorPayload }>();
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const payload = this.jwt.verify<VisitorPayload>(auth.slice(7), {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      if (payload.role !== 'visitor') throw new UnauthorizedException();
      req.visitor = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
