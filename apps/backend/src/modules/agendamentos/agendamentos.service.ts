import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';
import { SlotsService } from '../slots/slots.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreateAgendamentoDto, UpdateAgendamentoDto } from './agendamentos.dto';
import { Agendamento } from './agendamento.entity';

@Injectable()
export class AgendamentosService {
  private readonly logger = new Logger(AgendamentosService.name);
  private readonly paisWhatsapp: string[];

  constructor(
    @InjectRepository(Agendamento) private repo: Repository<Agendamento>,
    private wa: WhatsAppService,
    private slots: SlotsService,
    private gcal: GoogleCalendarService,
    private config: ConfigService,
  ) {
    this.paisWhatsapp = (config.get<string>('PAIS_WHATSAPP') ?? '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
  }

  findAll(): Promise<Agendamento[]> {
    return this.repo.find({
      where: { canceladoEm: IsNull() },
      order: { data: 'ASC' },
    });
  }

  async buscarPorWhatsappDigits(raw: string): Promise<Agendamento | null> {
    const digits = this.wa.extractDigits(raw);
    return this.repo.findOne({
      where: { whatsappDigits: digits, canceladoEm: IsNull() },
    });
  }

  async checkWhatsapp(raw: string): Promise<{ existe: boolean }> {
    const ag = await this.buscarPorWhatsappDigits(raw);
    return { existe: !!ag };
  }

  async create(dto: CreateAgendamentoDto): Promise<Agendamento> {
    this.slots.validarDia(dto.data);

    // Valida unicidade de data
    const dataOcupada = await this.repo.findOne({
      where: { data: dto.data, canceladoEm: IsNull() },
    });
    if (dataOcupada) throw new BadRequestException('Esta data já está ocupada');

    // Valida unicidade de whatsapp
    const digits = this.wa.extractDigits(dto.whatsapp);
    const wppDuplicado = await this.repo.findOne({
      where: { whatsappDigits: digits, canceladoEm: IsNull() },
    });
    if (wppDuplicado)
      throw new BadRequestException('Já existe agendamento para este WhatsApp');

    // Resolve waId no gateway
    let waId: string = digits;
    try {
      const resolved = await this.wa.resolveNumber(dto.whatsapp);
      waId = resolved.resolved;
    } catch {
      throw new BadRequestException(
        'Número informado não é um WhatsApp válido ou não foi encontrado',
      );
    }

    const acompanhantes = (dto.acompanhantes ?? []).filter((n) => n.trim());

    const ag = this.repo.create({
      data: dto.data,
      horario: dto.horario,
      nome: dto.nome.trim(),
      whatsapp: dto.whatsapp,
      whatsappDigits: digits,
      waId,
      email: dto.email?.trim() || undefined,
      acompanhantes,
    });

    const saved = await this.repo.save(ag);

    // Aguarda pós-criação para retornar estado final (WhatsApp + Google Calendar)
    await this.posCreate(saved).catch((e) =>
      this.logger.error(`Falha em pós-criação: ${(e as Error).message}`),
    );

    return (await this.repo.findOneBy({ id: saved.id })) ?? saved;
  }

  async update(
    id: string,
    dto: UpdateAgendamentoDto,
    whatsappDigits: string,
  ): Promise<Agendamento> {
    const ag = await this.repo.findOne({
      where: { id, whatsappDigits, canceladoEm: IsNull() },
    });
    if (!ag) throw new NotFoundException('Agendamento não encontrado');

    this.slots.validarDia(dto.data);

    // Valida que nova data não está ocupada por outro agendamento
    if (dto.data !== ag.data) {
      const dataOcupada = await this.repo.findOne({
        where: { data: dto.data, canceladoEm: IsNull() },
      });
      if (dataOcupada)
        throw new BadRequestException('Esta data já está ocupada');
    }

    ag.data = dto.data;
    ag.horario = dto.horario;
    return this.repo.save(ag);
  }

  async cancel(id: string, whatsappDigits: string): Promise<Agendamento> {
    const ag = await this.repo.findOne({
      where: { id, whatsappDigits, canceladoEm: IsNull() },
    });
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    ag.canceladoEm = new Date();
    const saved = await this.repo.save(ag);
    this.posCancelamento(saved);
    return saved;
  }

  async cancelByAdmin(id: string): Promise<Agendamento> {
    const ag = await this.repo.findOne({
      where: { id, canceladoEm: IsNull() },
    });
    if (!ag) throw new NotFoundException('Agendamento não encontrado');
    ag.canceladoEm = new Date();
    const saved = await this.repo.save(ag);
    this.posCancelamento(saved, true);
    return saved;
  }

  private posCancelamento(ag: Agendamento, peloAdmin = false): void {
    if (ag.googleEventId) {
      this.gcal.cancelEvent(ag.googleEventId).catch(() => {});
    }
    // Só notifica se a visita ainda não aconteceu
    const hoje = new Date().toISOString().slice(0, 10);
    if (ag.data < hoje) return;

    const textoVisitante = peloAdmin
      ? `Olá, *${ag.nome}*. Seu agendamento de visita à Melina no dia *${this.formatarData(ag.data)}* foi cancelado pelo organizador. Se quiser remarcar, acesse o site. 💛`
      : `Seu agendamento de visita à Melina no dia *${this.formatarData(ag.data)}* foi cancelado. Se mudar de ideia, remarque quando quiser. 💛`;

    this.wa
      .sendText({
        to: ag.waId || ag.whatsappDigits,
        text: textoVisitante,
        correlationId: this.toUuid(`cancel:${ag.id}`),
        idempotencyKey: this.toUuid(`cancel:${ag.id}`),
      })
      .catch((e: unknown) =>
        this.logger.warn(
          `Falha ao notificar cancelamento ao visitante: ${(e as Error).message}`,
        ),
      );

    // Avisa os pais
    const textoPais =
      `❌ *Visita cancelada*\n\n` +
      `👤 ${ag.nome}\n` +
      `📅 ${this.formatarData(ag.data)} · ${ag.horario}\n` +
      (peloAdmin
        ? `_(cancelado pelo organizador)_`
        : `_(cancelado pelo próprio visitante)_`);

    for (const numero of this.paisWhatsapp) {
      this.wa
        .sendText({
          to: numero,
          text: textoPais,
          correlationId: this.toUuid(`cancel-pais:${ag.id}:${numero}`),
          idempotencyKey: this.toUuid(`cancel-pais:${ag.id}:${numero}`),
        })
        .catch((e: unknown) =>
          this.logger.warn(
            `Falha ao notificar cancelamento aos pais (${numero}): ${(e as Error).message}`,
          ),
        );
    }
  }

  private toUuid(input: string): string {
    const h = createHash('sha256').update(input).digest('hex');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
  }

  private async posCreate(ag: Agendamento): Promise<void> {
    await this.enviarConfirmacao(ag);

    const visitantes = [ag.nome, ...ag.acompanhantes]
      .map((n) => `• ${n}`)
      .join('\n');
    const descricao = `👥 Visitantes:\n${visitantes}`;

    const eventId = await this.gcal.createEvent({
      titulo: 'Vamos visitar Melina 🌸 🍯',
      data: ag.data,
      horario: ag.horario,
      descricao,
      convidadoEmail: ag.email || undefined,
    });

    if (eventId) {
      await this.repo.update(ag.id, {
        googleEventId: eventId,
        inviteSent: !!ag.email,
      });
    }
  }

  // Busca agendamentos de um sábado específico para o cron
  async findBySabado(sabado: string): Promise<Agendamento[]> {
    return this.repo
      .createQueryBuilder('ag')
      .where('ag.data = :data', { data: sabado })
      .andWhere('ag.cancelado_em IS NULL')
      .getMany();
  }

  private async enviarConfirmacao(ag: Agendamento): Promise<void> {
    const acomp =
      ag.acompanhantes.length > 0
        ? `\n👥 Acompanhantes: ${ag.acompanhantes.join(', ')}`
        : '';
    const textoVisitante =
      `Olá, *${ag.nome}*! 🌸\n` +
      `Sua visita à Melina está confirmada!\n\n` +
      `📅 Data: ${this.formatarData(ag.data)}\n` +
      `🕓 Horário: ${ag.horario}${acomp}\n\n` +
      `📍 *Endereço:* Rua Recife, 616 – Apto 201 – Planalto da Boa Esperança\n\n` +
      `Qualquer dúvida, entre em contato. Até lá! 💛`;

    await this.wa.sendText({
      to: ag.waId || ag.whatsappDigits,
      text: textoVisitante,
      correlationId: ag.id,
      idempotencyKey: ag.id,
    });

    await this.repo.update(ag.id, { messageSent: true });

    // Notifica os pais a cada novo agendamento
    await this.notificarPais(ag);
  }

  private async notificarPais(ag: Agendamento): Promise<void> {
    if (this.paisWhatsapp.length === 0) return;

    const acomp =
      ag.acompanhantes.length > 0
        ? `\n👥 Acompanhantes: ${ag.acompanhantes.join(', ')}`
        : '';
    const texto =
      `🌸 *Nova visita agendada!*\n\n` +
      `👤 ${ag.nome}${acomp}\n` +
      `📅 ${this.formatarData(ag.data)} · ${ag.horario}\n` +
      `📱 ${ag.whatsapp}` +
      (ag.email ? `\n📧 ${ag.email}` : '');

    for (const numero of this.paisWhatsapp) {
      await this.wa
        .sendText({
          to: numero,
          text: texto,
          correlationId: this.toUuid(`notif-pais:${ag.id}:${numero}`),
          idempotencyKey: this.toUuid(`notif-pais:${ag.id}:${numero}`),
        })
        .catch((e: unknown) =>
          this.logger.warn(
            `Falha ao notificar pai ${numero}: ${(e as Error).message}`,
          ),
        );
    }
  }

  private formatarData(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
