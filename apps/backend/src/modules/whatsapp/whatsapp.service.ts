import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ResolveNumberResult = {
  input: string;
  resolved: string;
  jid: string;
  format: 'with_ninth_digit' | 'without_ninth_digit';
};

type SendTextResult = {
  jobId: string;
  status: 'queued' | 'duplicate_ignored';
  httpStatus: number;
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private config: ConfigService) {
    this.baseUrl = config
      .getOrThrow<string>('WHATSAPP_GATEWAY_URL')
      .replace(/\/$/, '');
    this.token = config.getOrThrow<string>('WHATSAPP_GATEWAY_TOKEN');
  }

  normalizeE164(value: string): string {
    const raw = (value || '').trim();
    if (!raw) throw new Error('Telefone é obrigatório');
    const hasPlus = raw.startsWith('+');
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15)
      throw new Error('Telefone inválido');
    if (hasPlus) return `+${digits}`;
    if (digits.startsWith('55')) return `+${digits}`;
    return `+55${digits}`;
  }

  extractDigits(value: string): string {
    return (value || '').replace(/\D/g, '');
  }

  async resolveNumber(phone: string): Promise<ResolveNumberResult> {
    const to = this.normalizeE164(phone);
    const res = await this.fetchWithRetry(
      `${this.baseUrl}/v1/whatsapp/resolve-number`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': this.token,
        },
        body: JSON.stringify({ to }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WhatsApp resolve falhou. HTTP ${res.status}: ${text}`);
    }
    return res.json() as Promise<ResolveNumberResult>;
  }

  async sendText(input: {
    to: string;
    text: string;
    correlationId?: string;
    idempotencyKey?: string;
  }): Promise<SendTextResult> {
    const res = await this.fetchWithRetry(`${this.baseUrl}/v1/messages/text`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-token': this.token,
      },
      body: JSON.stringify({
        to: input.to,
        text: input.text,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
      }),
    });
    if (res.status !== 202 && res.status !== 200) {
      const text = await res.text();
      throw new Error(`WhatsApp send falhou. HTTP ${res.status}: ${text}`);
    }
    const payload = (await res.json()) as {
      jobId?: string;
      status?: SendTextResult['status'];
    };
    if (!payload.jobId || !payload.status)
      throw new Error('Resposta inválida do WhatsApp Gateway');
    return {
      jobId: payload.jobId,
      status: payload.status,
      httpStatus: res.status,
    };
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    attempt = 1,
  ): Promise<Response> {
    const MAX = 3;
    const RETRYABLE = new Set([429, 500, 502, 503, 504]);
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        ...init,
      });
      if (RETRYABLE.has(res.status) && attempt < MAX) {
        await this.sleep(300 * attempt);
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      return res;
    } catch (err: unknown) {
      const retryable = [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ECONNRESET',
        'EAI_AGAIN',
        'AbortError',
      ];
      const code = (err as NodeJS.ErrnoException).code ?? (err as Error).name;
      if (retryable.includes(code) && attempt < MAX) {
        this.logger.warn(`WhatsApp retry ${attempt} — ${code}`);
        await this.sleep(300 * attempt);
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      throw err;
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
