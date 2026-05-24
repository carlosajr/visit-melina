import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const payload = this.jwt.verify<{ role: string }>(auth.slice(7), {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      if (payload.role !== 'admin') throw new UnauthorizedException();
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
