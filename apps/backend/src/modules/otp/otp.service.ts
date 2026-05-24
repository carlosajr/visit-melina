import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { OtpCode } from './otp.entity';

@Injectable()
export class OtpService {
  private readonly expiresSeconds: number;
  private readonly maxAttempts: number;

  constructor(
    @InjectRepository(OtpCode) private repo: Repository<OtpCode>,
    private wa: WhatsAppService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.expiresSeconds = config.get<number>('OTP_EXPIRES_SECONDS') ?? 300;
    this.maxAttempts = config.get<number>('OTP_MAX_ATTEMPTS') ?? 5;
  }

  async enviar(whatsappDigits: string, waId: string, ip: string): Promise<void> {
    // Invalida OTPs anteriores não usados para este número
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ usedAt: new Date() })
      .where('whatsapp = :w AND used_at IS NULL AND expires_at > NOW()', { w: whatsappDigits })
      .execute();

    const code = this.gerarCodigo();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.expiresSeconds * 1000);

    await this.repo.save(
      this.repo.create({ whatsapp: whatsappDigits, codeHash, expiresAt, ip }),
    );

    const minutes = Math.ceil(this.expiresSeconds / 60);
    await this.wa.sendText({
      to: waId,
      text: `Olá! Seu código de acesso para o agendamento da Melina é *${code}*\nEle é válido por ${minutes} minutos.\nPor segurança, não compartilhe este código.`,
      correlationId: this.toUuid(`otp:${whatsappDigits}:${expiresAt.getTime()}`),
      idempotencyKey: this.toUuid(`otp:${whatsappDigits}:${expiresAt.getTime()}`),
    });
  }

  async verificar(
    whatsappDigits: string,
    agendamentoId: string,
    code: string,
  ): Promise<{ accessToken: string }> {
    const otp = await this.repo.findOne({
      where: {
        whatsapp: whatsappDigits,
        usedAt: null as unknown as Date,
        expiresAt: MoreThan(new Date()),
      },
      order: { criadoEm: 'DESC' },
    });

    if (!otp) throw new NotFoundException('Código não encontrado ou expirado');
    if (otp.attempts >= this.maxAttempts) {
      throw new BadRequestException('Número máximo de tentativas atingido');
    }

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) {
      otp.attempts += 1;
      await this.repo.save(otp);
      throw new UnauthorizedException('Código incorreto');
    }

    otp.usedAt = new Date();
    await this.repo.save(otp);

    const accessToken = this.jwt.sign(
      { sub: whatsappDigits, role: 'visitor', agendamentoId },
      { expiresIn: '2h' },
    );
    return { accessToken };
  }

  private gerarCodigo(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private toUuid(input: string): string {
    const h = createHash('sha256').update(input).digest('hex');
    return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
  }
}
