import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly hash: string;

  constructor(
    private config: ConfigService,
    private jwt: JwtService,
  ) {
    this.hash = config.getOrThrow<string>('ADMIN_PASSWORD_HASH');
  }

  async adminLogin(senha: string): Promise<{ accessToken: string }> {
    const ok = await bcrypt.compare(senha, this.hash);
    if (!ok) throw new UnauthorizedException('Senha incorreta');
    const accessToken = this.jwt.sign({ role: 'admin' }, { expiresIn: '8h' });
    return { accessToken };
  }
}
