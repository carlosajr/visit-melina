import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { google, calendar_v3 } from 'googleapis';
import { Repository } from 'typeorm';
import { GoogleToken } from './google-token.entity';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly calendarId: string;

  constructor(
    @InjectRepository(GoogleToken) private tokenRepo: Repository<GoogleToken>,
    private config: ConfigService,
  ) {
    this.calendarId = config.get<string>('GOOGLE_CALENDAR_ID') ?? 'primary';
  }

  getAuthUrl(): string {
    const client = this.createOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  }

  async handleCallback(code: string): Promise<void> {
    const client = this.createOAuthClient();
    const { tokens } = await client.getToken(code);

    client.setCredentials(tokens);

    let email = '';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();
      email = data.email ?? '';
    } catch (e: unknown) {
      this.logger.warn(
        `Não foi possível obter email do Google: ${(e as Error).message}`,
      );
    }

    await this.tokenRepo.save({
      id: 'admin',
      accessToken: tokens.access_token!,
      refreshToken:
        tokens.refresh_token ??
        (await this.tokenRepo.findOneBy({ id: 'admin' }))?.refreshToken ??
        '',
      expiresAt: new Date(tokens.expiry_date!),
      email,
    });
    this.logger.log(
      `Google Calendar conectado: ${email || '(email não disponível)'}`,
    );
  }

  async getStatus(): Promise<{ conectado: boolean; email?: string }> {
    const token = await this.tokenRepo.findOneBy({ id: 'admin' });
    return token
      ? { conectado: true, email: token.email }
      : { conectado: false };
  }

  async createEvent(params: {
    titulo: string;
    data: string; // YYYY-MM-DD
    horario: string; // HH:MM
    descricao?: string;
    convidadoEmail?: string;
  }): Promise<string | null> {
    const client = await this.getAuthenticatedClient();
    if (!client) return null;

    const cal = google.calendar({ version: 'v3', auth: client });
    const start = `${params.data}T${params.horario}:00-03:00`;
    const end = `${params.data}T${this.addHour(params.horario)}:00-03:00`;

    const event: calendar_v3.Schema$Event = {
      summary: params.titulo,
      description: params.descricao,
      location:
        'R. Recife, 616 - Planalto da Boa Esperança, João Pessoa - PB, 58065-006, Brasil',
      colorId: '4', // Flamingo
      start: { dateTime: start, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: end, timeZone: 'America/Sao_Paulo' },
      attendees: params.convidadoEmail
        ? [{ email: params.convidadoEmail }]
        : [],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 60 }],
      },
    };

    try {
      const res = await cal.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        sendNotifications: !!params.convidadoEmail,
      });
      return res.data.id ?? null;
    } catch (e: unknown) {
      this.logger.error(
        `Erro ao criar evento Google Calendar: ${(e as Error).message}`,
      );
      return null;
    }
  }

  async cancelEvent(eventId: string): Promise<void> {
    const client = await this.getAuthenticatedClient();
    if (!client) return;
    const cal = google.calendar({ version: 'v3', auth: client });
    try {
      await cal.events.delete({ calendarId: this.calendarId, eventId });
    } catch (e: unknown) {
      this.logger.warn(
        `Erro ao cancelar evento ${eventId}: ${(e as Error).message}`,
      );
    }
  }

  private async getAuthenticatedClient() {
    const token = await this.tokenRepo.findOneBy({ id: 'admin' });
    if (!token) return null;

    const client = this.createOAuthClient();
    client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiresAt.getTime(),
    });

    client.on('tokens', (tokens) => {
      if (tokens.access_token) {
        token.accessToken = tokens.access_token;
        token.expiresAt = new Date(tokens.expiry_date!);
        void this.tokenRepo.save(token);
      }
    });

    return client;
  }

  private createOAuthClient() {
    return new google.auth.OAuth2(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  private addHour(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    return `${String(h + 2).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
