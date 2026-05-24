# Integração com WhatsApp Gateway

Este documento descreve como outro projeto deve integrar com o WhatsApp Gateway usado por este sistema para:

- validar/resolver um número de WhatsApp;
- enviar mensagem de texto;
- implementar fluxo de OTP;
- reutilizar o envio em outros fluxos transacionais.

## Visão geral

O gateway é um serviço HTTP externo protegido por token interno. A aplicação consumidora não deve falar diretamente com WhatsApp/Baileys. Ela deve chamar o gateway por HTTP usando:

- `WHATSAPP_GATEWAY_URL`: URL base do gateway.
- `WHATSAPP_GATEWAY_TOKEN`: mesmo valor configurado como `INTERNAL_TOKEN` no gateway.
- Header obrigatório: `x-internal-token: <WHATSAPP_GATEWAY_TOKEN>`.
- Header recomendado: `content-type: application/json`.

Exemplo local:

```env
WHATSAPP_GATEWAY_URL=http://localhost:3010
WHATSAPP_GATEWAY_TOKEN=dev-token
WHATSAPP_SEND_OTP_ENABLED=true
PORTAL_OTP_EXPIRES_SECONDS=300
PORTAL_OTP_MAX_ATTEMPTS=5
PORTAL_OTP_RATE_LIMIT_MAX=5
PORTAL_OTP_RATE_LIMIT_WINDOW_SECONDS=600
```

Em produção, use uma URL interna/privada sempre que possível e trate `WHATSAPP_GATEWAY_TOKEN` como segredo.

## Formato de telefone

Padronize números em E.164 antes de chamar o gateway.

Para Brasil:

- entrada `83999999999` deve virar `+5583999999999`;
- entrada `5583999999999` deve virar `+5583999999999`;
- entrada `+5583999999999` permanece `+5583999999999`.

Regra prática:

```ts
export function normalizePhoneToE164(value: string): string {
  const raw = (value || '').trim();
  if (!raw) throw new Error('Telefone é obrigatório');

  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Telefone inválido');
  }

  if (hasPlus) return `+${digits}`;
  if (digits.startsWith('55')) return `+${digits}`;
  return `+55${digits}`;
}
```

## Validar/resolver número de WhatsApp

Use esta chamada antes de persistir um `waId` ou antes de enviar mensagem. O gateway tenta encontrar o número no WhatsApp considerando variações com e sem nono dígito.

Endpoint:

```http
POST <WHATSAPP_GATEWAY_URL>/v1/whatsapp/resolve-number
```

Headers:

```http
content-type: application/json
x-internal-token: <WHATSAPP_GATEWAY_TOKEN>
```

Body:

```json
{
  "to": "+5583999999999"
}
```

Resposta de sucesso:

```json
{
  "input": "+5583999999999",
  "resolved": "+558388884444",
  "jid": "558388884444@s.whatsapp.net",
  "format": "without_ninth_digit"
}
```

Campos:

- `input`: número enviado.
- `resolved`: número final validado no WhatsApp. Persista este valor como `waId`/destinatário preferencial.
- `jid`: identificador WhatsApp interno.
- `format`: `with_ninth_digit` ou `without_ninth_digit`.

Erros relevantes:

- `400`: número não encontrado no WhatsApp.
- `401`: token interno inválido.
- `503`: gateway indisponível.
- outros `5xx`: falha temporária no gateway.

Exemplo `curl`:

```bash
curl -i -X POST "$WHATSAPP_GATEWAY_URL/v1/whatsapp/resolve-number" \
  -H "content-type: application/json" \
  -H "x-internal-token: $WHATSAPP_GATEWAY_TOKEN" \
  -d '{"to":"+5583999999999"}'
```

## Enviar mensagem de texto

Endpoint:

```http
POST <WHATSAPP_GATEWAY_URL>/v1/messages/text
```

Headers:

```http
content-type: application/json
x-internal-token: <WHATSAPP_GATEWAY_TOKEN>
```

Body:

```json
{
  "to": "+558388884444",
  "text": "Olá! Seu código de acesso é *123456*",
  "correlationId": "otp:user-123:otp-456",
  "idempotencyKey": "otp:user-123:otp-456"
}
```

Campos:

- `to`: número validado/resolvido. Preferir o `resolved` retornado por `/v1/whatsapp/resolve-number`.
- `text`: mensagem em texto. Pode conter markdown simples aceito pelo WhatsApp, como `*negrito*`.
- `correlationId`: opcional, mas recomendado para rastrear logs por fluxo.
- `idempotencyKey`: opcional, mas recomendado para evitar duplicidade em retry.

Resposta de mensagem enfileirada:

```json
{
  "jobId": "job-1",
  "status": "queued"
}
```

Resposta quando o gateway ignorou duplicidade:

```json
{
  "jobId": "job-1",
  "status": "duplicate_ignored"
}
```

Status HTTP esperados:

- `202`: mensagem aceita/enfileirada.
- `200`: requisição idempotente já processada, normalmente `duplicate_ignored`.
- `401`: token interno inválido.
- `429`: rate limit do gateway, pode tentar novamente com backoff.
- `5xx`: erro temporário, pode tentar novamente com backoff.

Exemplo `curl`:

```bash
curl -i -X POST "$WHATSAPP_GATEWAY_URL/v1/messages/text" \
  -H "content-type: application/json" \
  -H "x-internal-token: $WHATSAPP_GATEWAY_TOKEN" \
  -d '{
    "to":"+558388884444",
    "text":"Olá! Seu código de acesso é *123456*",
    "correlationId":"otp:user-123:otp-456",
    "idempotencyKey":"otp:user-123:otp-456"
  }'
```

## Cliente TypeScript recomendado

```ts
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

export class WhatsAppGatewayClient {
  constructor(
    private readonly gatewayUrl: string,
    private readonly token: string
  ) {}

  async resolveNumber(to: string): Promise<ResolveNumberResult> {
    const response = await fetch(`${this.gatewayUrl.replace(/\/$/, '')}/v1/whatsapp/resolve-number`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-token': this.token
      },
      body: JSON.stringify({ to })
    });

    if (!response.ok) {
      throw new Error(`Falha ao validar WhatsApp. HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json() as Promise<ResolveNumberResult>;
  }

  async sendText(input: {
    to: string;
    text: string;
    correlationId?: string;
    idempotencyKey?: string;
  }): Promise<SendTextResult> {
    const resolved = await this.resolveNumber(input.to);

    const response = await fetch(`${this.gatewayUrl.replace(/\/$/, '')}/v1/messages/text`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-token': this.token
      },
      body: JSON.stringify({
        to: resolved.resolved,
        text: input.text,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey
      })
    });

    if (response.status !== 202 && response.status !== 200) {
      throw new Error(`Falha ao enviar WhatsApp. HTTP ${response.status}: ${await response.text()}`);
    }

    const payload = (await response.json()) as { jobId?: string; status?: SendTextResult['status'] };
    if (!payload.jobId || !payload.status) {
      throw new Error('Resposta inválida do WhatsApp Gateway');
    }

    return {
      jobId: payload.jobId,
      status: payload.status,
      httpStatus: response.status
    };
  }
}
```

Para produção, adicione timeout curto e retry apenas para `429`, `5xx`, `AbortError`, `ECONNREFUSED`, `ETIMEDOUT`, `ECONNRESET` e `EAI_AGAIN`. Não faça retry em `400` ou `401`.

## Fluxo de OTP recomendado

1. Receber telefone do usuário.
2. Normalizar para E.164.
3. Aplicar rate limit por telefone e por IP.
4. Verificar se o telefone pertence a um usuário elegível.
5. Gerar código numérico de 6 dígitos.
6. Salvar hash do código, expiração, tentativas e IP. Nunca salve o código puro.
7. Montar mensagem.
8. Enviar via gateway com `correlationId` e `idempotencyKey`.
9. Na validação, comparar hash, checar expiração, tentativas e marcar OTP como usado.
10. Emitir token/sessão somente após OTP válido.

Mensagem padrão:

```txt
Olá! Seu código de acesso é *{code}*
Ele é válido por {minutes} minutos.
Por segurança, não compartilhe este código com ninguém.
```

Idempotência recomendada:

```txt
otp:<userId>:<otpId>
```

Correlação recomendada:

```txt
otp:<userId>:<otpId>
```

Configurações recomendadas:

- `PORTAL_OTP_EXPIRES_SECONDS=300`
- `PORTAL_OTP_MAX_ATTEMPTS=5`
- `PORTAL_OTP_RATE_LIMIT_MAX=5`
- `PORTAL_OTP_RATE_LIMIT_WINDOW_SECONDS=600`
- `WHATSAPP_SEND_OTP_ENABLED=true`

Em ambiente de desenvolvimento, é aceitável retornar/logar `devCode`. Em produção, nunca retorne o código OTP na resposta.

## Fluxos transacionais além de OTP

Use o mesmo cliente para mensagens como aprovação de cadastro, confirmação de inscrição, cobrança, lembrete ou avisos administrativos.

Boas práticas:

- valide/resolva o número no cadastro e persista o `resolved` como `waId`;
- sempre envie com `idempotencyKey` determinística por evento de negócio;
- use `correlationId` legível para logs;
- não bloqueie uma aprovação ou operação principal por falha de notificação, exceto quando a mensagem for parte obrigatória do fluxo, como OTP;
- registre logs com telefone mascarado.

Exemplos de chaves:

```txt
participant-approval:<registrationId>
collaborator-approval:<collaboratorId>
event-registration:<eventId>:<participantId>
payment-reminder:<chargeId>:<dueDate>
```

## Prompt pronto para usar com Codex em outro projeto

```txt
Implemente integração com WhatsApp Gateway para OTP e mensagens transacionais.

Contrato do gateway:
- Base URL via WHATSAPP_GATEWAY_URL.
- Token via WHATSAPP_GATEWAY_TOKEN, enviado no header x-internal-token.
- Validar número: POST /v1/whatsapp/resolve-number com body { "to": "+5583999999999" }.
- Resposta: { input, resolved, jid, format }, onde format é "with_ninth_digit" ou "without_ninth_digit".
- Enviar texto: POST /v1/messages/text com body { to, text, correlationId?, idempotencyKey? }.
- Sucesso: HTTP 202 ou 200 com { jobId, status }, onde status é "queued" ou "duplicate_ignored".
- Não fazer retry em 400/401. Fazer retry com backoff em 429/5xx/timeouts/conexão recusada.

Requisitos:
- Criar um WhatsAppGatewayClient com resolveNumber e sendText.
- Normalizar telefone para E.164 Brasil antes de usar o gateway.
- Persistir o número resolvido retornado em resolved como waId quando cadastrar/atualizar usuários.
- Implementar fluxo OTP:
  1. rate limit por telefone e IP;
  2. gerar código numérico de 6 dígitos;
  3. salvar apenas hash do código, expiração e tentativas;
  4. enviar WhatsApp com mensagem "Olá! Seu código de acesso é *{code}*. Ele é válido por {minutes} minutos.";
  5. usar idempotencyKey "otp:<userId>:<otpId>";
  6. validar expiração, tentativas e hash;
  7. marcar OTP como usado e emitir token/sessão.
- Em produção, nunca retornar o código OTP na resposta.
- Para mensagens não-OTP, usar idempotencyKey por evento de negócio e não interromper o fluxo principal se a notificação falhar, salvo exigência explícita.
```

