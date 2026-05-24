import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { AgendamentosService } from './agendamentos.service';
import type { Agendamento } from './agendamento.entity';

@Injectable()
export class LembreteCron {
  private readonly logger = new Logger(LembreteCron.name);
  private readonly paisWhatsapp: string[];

  constructor(
    private agService: AgendamentosService,
    private wa: WhatsAppService,
    config: ConfigService,
  ) {
    this.paisWhatsapp = (config.get<string>('PAIS_WHATSAPP') ?? '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
  }

  // Toda sexta-feira às 12h (horário de Brasília)
  @Cron('0 12 * * 5', { timeZone: 'America/Sao_Paulo' })
  async enviarLembretes() {
    const { sabado, domingo } = this.proximoFimDeSemana();
    this.logger.log(`Enviando lembretes para ${sabado} e ${domingo}`);

    const agendamentos = await this.agService.findBySabadoDomingo(sabado, domingo);
    this.logger.log(`${agendamentos.length} agendamento(s) encontrado(s)`);

    if (agendamentos.length === 0) return;

    // Lembrete individual para cada visitante
    for (const ag of agendamentos) {
      try {
        await this.wa.sendText({
          to: ag.waId || ag.whatsappDigits,
          text:
            `Olá, *${ag.nome}*! 🌸\n` +
            `Lembrando que sua visita à Melina é *${this.diaNome(ag.data)}, ${this.formatarData(ag.data)} às ${ag.horario}*.\n` +
            `Estamos te esperando! 💛`,
          correlationId: this.lembreteUuid(ag.id, sabado),
          idempotencyKey: this.lembreteUuid(ag.id, sabado),
        });
      } catch (e) {
        this.logger.error(`Falha ao enviar lembrete para ${ag.id}: ${e.message}`);
      }
    }

    // Resumo do fim de semana para os pais
    await this.notificarPais(agendamentos, sabado, domingo);
  }

  private async notificarPais(agendamentos: Agendamento[], sabado: string, domingo: string): Promise<void> {
    if (this.paisWhatsapp.length === 0) return;

    const porDia = (data: string) => agendamentos.filter((ag) => ag.data === data);
    const linhasDia = (data: string) => porDia(data).map((ag) => {
      const acomp = ag.acompanhantes.length > 0 ? ` (+${ag.acompanhantes.length})` : '';
      return `  • ${ag.nome}${acomp} · ${ag.horario}`;
    });

    const blocos: string[] = [];
    if (porDia(sabado).length > 0) {
      blocos.push(`📅 *Sábado, ${this.formatarData(sabado)}:*\n${linhasDia(sabado).join('\n')}`);
    }
    if (porDia(domingo).length > 0) {
      blocos.push(`📅 *Domingo, ${this.formatarData(domingo)}:*\n${linhasDia(domingo).join('\n')}`);
    }

    const texto = `🌸 *Visitas da Melina este fim de semana:*\n\n${blocos.join('\n\n')}`;

    for (const numero of this.paisWhatsapp) {
      await this.wa.sendText({
        to: numero,
        text: texto,
        correlationId: this.lembreteUuid(`pais:${numero}`, sabado),
        idempotencyKey: this.lembreteUuid(`pais:${numero}`, sabado),
      }).catch((e) => this.logger.warn(`Falha ao notificar pai ${numero}: ${e.message}`));
    }
  }

  // Gera UUID v4-like determinístico a partir de agendamentoId + semana (para idempotência)
  private lembreteUuid(agId: string, semana: string): string {
    const hash = createHash('sha256').update(`lembrete:${agId}:${semana}`).digest('hex');
    return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
  }

  private proximoFimDeSemana(): { sabado: string; domingo: string } {
    const hoje = new Date();
    const dow = hoje.getDay(); // 5=sexta
    const diasAteSabado = (6 - dow + 7) % 7 || 7;
    const sabado = new Date(hoje);
    sabado.setDate(hoje.getDate() + diasAteSabado);
    const domingo = new Date(sabado);
    domingo.setDate(sabado.getDate() + 1);
    return {
      sabado: this.toISO(sabado),
      domingo: this.toISO(domingo),
    };
  }

  private toISO(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private formatarData(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private diaNome(iso: string): string {
    const dow = new Date(`${iso}T12:00:00`).getDay();
    return dow === 6 ? 'sábado' : 'domingo';
  }
}
