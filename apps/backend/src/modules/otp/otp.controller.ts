import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import type { Request } from 'express';
import { AgendamentosService } from '../agendamentos/agendamentos.service';
import { OtpService } from './otp.service';

class EnviarOtpDto {
  @IsString()
  whatsapp: string; // dígitos brutos do visitante
}

class VerificarOtpDto {
  @IsString()
  whatsapp: string;

  @IsString()
  codigo: string;
}

@ApiTags('otp')
@Controller('otp')
export class OtpController {
  constructor(
    private otpService: OtpService,
    private agService: AgendamentosService,
  ) {}

  @Post('enviar')
  async enviar(@Body() dto: EnviarOtpDto, @Req() req: Request) {
    const ag = await this.agService.buscarPorWhatsappDigits(dto.whatsapp);
    if (!ag) return { enviado: false, motivo: 'Agendamento não encontrado' };
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    await this.otpService.enviar(ag.whatsappDigits, ag.waId || ag.whatsappDigits, ip);
    return { enviado: true };
  }

  @Post('verificar')
  async verificar(@Body() dto: VerificarOtpDto) {
    const ag = await this.agService.buscarPorWhatsappDigits(dto.whatsapp);
    if (!ag) return { valido: false };
    return this.otpService.verificar(ag.whatsappDigits, ag.id, dto.codigo);
  }

  @Post('reenviar')
  async reenviar(@Body() dto: EnviarOtpDto, @Req() req: Request) {
    return this.enviar(dto, req);
  }
}
