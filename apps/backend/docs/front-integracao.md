# Visite a Melina — Especificação do protótipo

Documento que reúne, num só lugar, **todos os fluxos, telas, regras de negócio e validações** implementados no protótipo `VisiteMelina`. Serve como referência para handoff de produto, escrita de testes e integração com o backend real.

> 🛠️ **Estado atual**: protótipo front-end com persistência em `localStorage`. Cada `TODO` no código aponta um ponto de integração com a API REST real.

---

## Sumário

1. [Glossário e domínio](#1-glossário-e-domínio)
2. [Telas e fluxo principal](#2-telas-e-fluxo-principal)
3. [Fluxo 1 — Novo agendamento (5 passos)](#3-fluxo-1--novo-agendamento-5-passos)
4. [Fluxo 2 — Ver / alterar / cancelar (Meu agendamento)](#4-fluxo-2--ver--alterar--cancelar-meu-agendamento)
5. [Fluxo 3 — Painel administrativo](#5-fluxo-3--painel-administrativo)
6. [Regras de negócio centrais](#6-regras-de-negócio-centrais)
7. [Validações de entrada](#7-validações-de-entrada)
8. [Modelo de dados](#8-modelo-de-dados)
9. [Cenários de erro & estados de borda](#9-cenários-de-erro--estados-de-borda)
10. [Dados de exemplo (seed)](#10-dados-de-exemplo-seed)
11. [Configurações & tweaks](#11-configurações--tweaks)
12. [Pontos de integração (`TODO` no código)](#12-pontos-de-integração-todo-no-código)

---

## 1. Glossário e domínio

| Termo              | Significado                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| **Visita**         | Encontro presencial com a Melina, no jardim, em horário marcado.                                   |
| **Tipo de visita** | `amigo` (sábados) ou `familia` (domingos). Determinado pelo dia da semana do slot.                 |
| **Slot**           | Combinação `{ data, horário }` aberta para agendamento, gerenciada pelo admin.                     |
| **Agendamento**    | Reserva de um slot por um visitante, identificado pelo WhatsApp.                                   |
| **Acompanhante**   | Pessoa adicional incluída no agendamento (nome livre, opcional).                                   |
| **OTP**            | Código de 6 dígitos enviado por WhatsApp para verificar a identidade ao acessar "Meu agendamento". |
| **Admin**          | Operador autenticado por senha; gerencia slots e agendamentos.                                     |

---

## 2. Telas e fluxo principal

```
                          ┌────────────────────┐
                          │     01 · Início    │
                          │       (Home)       │
                          └──────────┬─────────┘
            ┌──────────────────────────┼───────────────────────────┐
            ▼                          ▼                           ▼
   ┌─────────────────┐       ┌────────────────────┐       ┌────────────────┐
   │  Novo agendamento│      │  Meu agendamento   │       │ Painel admin   │
   │  (5 passos)      │      │  (busca → OTP →    │       │  (senha)       │
   │                  │      │   visualizar)      │       │                │
   └────────┬─────────┘      └─────────┬──────────┘       └────────────────┘
            ▼                          ▼
   ┌─────────────────┐       ┌────────────────────┐
   │   07 · Sucesso  │       │  Alterar data →    │
   │                 │       │  reentra no fluxo  │
   │                 │       │  no passo "Data"   │
   └────────┬────────┘       └────────────────────┘
            │                          │
            ▼                          ▼
   "Ver meu agendamento" ──▶ entra direto no estado `view`
   (com bypass do OTP, pois acabou de criar)
```

Os fluxos são orquestrados por `App.jsx`, que mantém um estado `flow ∈ { home, novo, sucesso, meu, admin }` e, dentro de `novo`, um `novoStep ∈ { tipo, data, dados, acompanhantes, confirmacao }`.

---

## 3. Fluxo 1 — Novo agendamento (5 passos)

### Passo 1 · Tipo de visita

| Item                | Regra                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Opções**          | "Sou amigo" (sábados) ou "Sou família" (domingos).                                     |
| **Obrigatoriedade** | É preciso selecionar para avançar.                                                     |
| **Lógica**          | A escolha define o dia da semana do passo seguinte: amigo → sábado, família → domingo. |
| **Voltar**          | Retorna à Home.                                                                        |

### Passo 2 · Escolha da data

| Item                                   | Regra                                                                                                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Listagem**                           | Apenas os slots cujo dia da semana corresponde ao tipo escolhido.                                                                                                                                          |
| **Janela padrão**                      | 8 semanas à frente, a partir de **25/05/2026** (`DATA_INICIAL` em `utils/datas.js`). Os slots reais vêm do admin via `useSlots`.                                                                           |
| **Datas ocupadas**                     | Apresentadas em cinza, **desabilitadas**. Uma data fica "ocupada" assim que **existe um agendamento qualquer para aquele dia** (chave `data` no agendamento).                                              |
| **Estado vazio**                       | Se não há nenhum slot cadastrado para o tipo, mostra card "Nenhum {sábado/domingo} disponível no momento".                                                                                                 |
| **Seleção**                            | Toque em um card livre → grava `data` + `horario` no rascunho e avança.                                                                                                                                    |
| **Modo edição** (`editandoId != null`) | A data atual do próprio agendamento **não conta como ocupada** (não conflita consigo mesmo). Ao escolher uma nova data, **salva direto** e volta para a tela "Meu agendamento" — pula o restante do fluxo. |
| **Horário**                            | Vem junto do slot (atualmente fixo em `16:00`, mas o modelo já suporta horários variáveis).                                                                                                                |

### Passo 3 · Dados pessoais

Campos:

| Campo         | Obrigatório  | Validação                                                                                                                                   |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Nome completo | Sim          | mínimo 2 caracteres (após `trim`).                                                                                                          |
| WhatsApp      | Sim          | 11 dígitos, DDD entre 11 e 99, **3º dígito sempre `9`** (celular). Máscara aplicada em tempo real: `(XX) XXXXX-XXXX`.                       |
| E-mail        | **Opcional** | se preenchido, deve casar com regex de e-mail. Se for `@gmail.com`, exibe helper de que **um convite será enviado para o Google Calendar**. |

**Atalho de duplicidade.** Se o WhatsApp informado já tem agendamento, o botão "Continuar" é bloqueado e aparece um toast com CTA "Ver meu agendamento" → leva direto ao fluxo de "Meu agendamento" com o número pré-preenchido.

### Passo 4 · Acompanhantes

| Item                    | Regra                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **Quantidade**          | 0 a N. Opcional.                                                                             |
| **Entrada**             | Cada acompanhante é um nome livre (sem validação de formato).                                |
| **Filtro de submissão** | Acompanhantes em branco são removidos automaticamente ao salvar (`filter((n) => n.trim())`). |

### Passo 5 · Confirmação

| Item                         | Regra                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| **Resumo**                   | Mostra tipo, data + horário, nome, WhatsApp, e-mail (se houver) e lista de acompanhantes. |
| **Edição inline**            | Cada linha tem botão "editar" que devolve ao passo correspondente.                        |
| **Botão "Confirmar visita"** | Cria o agendamento via `useAgendamentos.criar()`.                                         |
| **Estado salvando**          | Botão muda para "Confirmando…" e fica desabilitado durante a simulação de 350 ms.         |
| **Erro**                     | Conflito (data já ocupada ou WhatsApp duplicado) renderiza um toast de erro.              |
| **Sucesso**                  | Avança para a tela 07 (Sucesso).                                                          |

### 07 · Sucesso

| Item                      | Regra                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Confirmações exibidas** | "Mensagem enviada por WhatsApp" (`messageSent`) e, se for `@gmail.com`, "Convite criado no Google Calendar" (`inviteSent`). |
| **Ações**                 | "Voltar ao início" (Home) ou "Ver meu agendamento" (entra direto no estado `view`, **pulando OTP**).                        |

---

## 4. Fluxo 2 — Ver / alterar / cancelar (Meu agendamento)

Três sub-etapas internas:

### 4.1 · Busca

| Item               | Regra                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| **Entrada**        | WhatsApp (máscara aplicada).                                              |
| **Validação**      | Mesma do passo 3.                                                         |
| **Não encontrado** | Mostra erro "Não encontramos um agendamento para este número."            |
| **Encontrado**     | Avança para OTP. (TODO real: enviar OTP via WhatsApp e só então avançar.) |

### 4.2 · OTP (verificação)

| Item                       | Regra                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Tamanho**                | 6 dígitos numéricos.                                                                                                     |
| **Aceitação no protótipo** | **Qualquer** combinação de 6 dígitos é aceita (sugerido `123456`). Bloco visual "Protótipo" explica isso na tela.        |
| **Erro**                   | Tamanho diferente de 6 ou caracteres não-numéricos → mensagem inline.                                                    |
| **Reenviar código**        | Botão dispara `POST /otp/reenviar` (TODO). No protótipo, só zera o input e reinicia o contador.                          |
| **Bypass**                 | A flag `pularOTP` permite entrar direto em "view" — usada após criar agendamento e em alguns artboards do design canvas. |

### 4.3 · View (visualizar)

| Item             | Regra                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Conteúdo**     | Resumo do agendamento (tipo, data, horário, nome, WhatsApp, e-mail, acompanhantes, indicadores de WhatsApp e Google Calendar).    |
| **Alterar data** | Reentra no fluxo principal **no passo 2** com `editandoId` e `dataOriginal` setados. Ver regra no passo 2.                        |
| **Cancelar**     | Abre dialog de confirmação. Confirmando, chama `cancelar(id)` e mostra estado "Agendamento cancelado" com CTA para criar um novo. |
| **Voltar**       | Volta para Home (resetando estado).                                                                                               |

---

## 5. Fluxo 3 — Painel administrativo

| Item                        | Regra                                                                                                                                                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticação**            | Senha em texto puro: **`Melina2026`** (constante `ADMIN_PASSWORD` em `PainelAdmin.jsx`). A ser substituída por autenticação real.                                                  |
| **Aba "Agendamentos"**      | Tabela com todos os agendamentos: tipo, data, horário, nome, WhatsApp, e-mail, nº de acompanhantes, indicador GCal, ação cancelar (com `confirm()` nativo).                        |
| **Exportar CSV**            | Gera arquivo `agendamentos-melina-YYYY-MM-DD.csv` com BOM UTF-8. Colunas: Tipo, Data, Horário, Nome, WhatsApp, E-mail, Acompanhantes (separados por `;`), Convite GCal, Criado em. |
| **Aba "Datas disponíveis"** | Gerencia slots: criar, editar (data ou horário), remover. Validações descritas em [§6.3](#63-slots--datas-disponíveis).                                                            |
| **Resetar dados**           | Apaga `localStorage` (agendamentos + flags de seed). Dialog de confirmação. Os seeds são recriados no próximo carregamento.                                                        |
| **Sair**                    | Volta para Home.                                                                                                                                                                   |
| **Rodapé**                  | Mostra contagem total + quantos com Google Calendar (filtragem por `inviteSent`).                                                                                                  |

---

## 6. Regras de negócio centrais

### 6.1 · Capacidade

- **Um grupo por dia.** Cada data (`YYYY-MM-DD`) só admite **um** agendamento. Tentativa de criar segundo → `Error("Esta data já está ocupada")`.
- **Comunicado na UI** em três pontos: Home (card "Um grupo por dia"), passo 1 (card lateral), passo 2 (datas em cinza).

### 6.2 · Unicidade por WhatsApp

- **WhatsApp é chave única de visitante.** Não é permitido criar dois agendamentos com o mesmo número (`whatsappDigits`). Tentativa → `Error("Já existe agendamento para este WhatsApp")`.
- Aparece de forma proativa no passo 3 (toast "Este número já tem agendamento"), guiando para "Ver meu agendamento".

### 6.3 · Slots / datas disponíveis

- **Apenas sábados e domingos.** `tipoDoDia(iso)` rejeita qualquer outro dia da semana (`Error("A data deve ser um sábado ou domingo")`).
- **Sábado → tipo `amigo`. Domingo → tipo `familia`.** O tipo é **derivado** da data, não armazenado.
- **Uma data, um slot.** Tentar criar slot para uma data já existente → erro.
- **Horário** em formato `HH:MM` (regex `^\d{2}:\d{2}$`).
- **Janela padrão** ao criar via seed: 8 semanas (sábado + domingo) a partir de 25/05/2026, todos às 16:00.

### 6.4 · Modo edição de data

- Quando o usuário entra em "Alterar data" a partir do MeuAgendamento, o rascunho recebe `editandoId` e `dataOriginal`.
- O passo 2 ignora a `dataOriginal` na lista de datas ocupadas (`ignorarOcupacaoData`), permitindo manter a mesma data se desejado.
- Ao selecionar uma nova data, **salva direto** (não passa pelos passos 3–5) e volta para o MeuAgendamento.

### 6.5 · Comunicação automática

| Canal           | Quando                     | Regra                                                                                  |
| --------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| WhatsApp        | Após confirmar agendamento | `messageSent = true` sempre.                                                           |
| Google Calendar | Após confirmar agendamento | `inviteSent = true` **apenas se o e-mail for `@gmail.com`** (regex `/@gmail\.com$/i`). |

### 6.6 · Persistência

- Tudo no `localStorage`:
  - `visite-melina:agendamentos:v1`
  - `visite-melina:slots:v1`
  - `visite-melina:seeded:v2` / `visite-melina:slots-seeded:v1` (flags de seed)
- Eventos customizados (`vm:agendamentos-changed`, `vm:slots-changed`) sincronizam instâncias múltiplas na mesma página (útil no design canvas, que monta várias instâncias do app).

---

## 7. Validações de entrada

### 7.1 · WhatsApp

Implementação em `mascaras.js` (`validarWhatsApp`) e `useValidacaoWhatsApp` (estados reativos).

| Estado                 | Quando                     | Mensagem                                 |
| ---------------------- | -------------------------- | ---------------------------------------- |
| `vazio`                | Sem dígitos                | —                                        |
| `incompleto`           | < 11 dígitos               | "Digite o DDD e os 9 dígitos do celular" |
| `invalido` (DDD)       | DDD < 11 ou > 99           | "DDD inválido"                           |
| `invalido` (9º dígito) | 3º dígito ≠ `9`            | "O número precisa começar com 9"         |
| `valido`               | 11 dígitos, DDD ok, 3º = 9 | (✓ verde)                                |

**Máscara**: aplicada a cada keystroke. Acumula dígitos até 11, formata `(XX) XXXXX-XXXX` progressivamente.

### 7.2 · Nome

- Mínimo 2 caracteres após `trim()`.
- Sem validação de formato (aceita acentos, espaços etc).

### 7.3 · E-mail

- **Opcional**: se vazio, considera válido.
- Se preenchido: regex `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` (`validarEmail`).
- Helper visual ativo só quando é `@gmail.com` válido.

### 7.4 · OTP

- 6 dígitos exatos.
- Apenas numérico.

### 7.5 · Slots (admin)

- Data deve ser sábado ou domingo.
- Horário em `HH:MM`.
- Data não pode coincidir com outro slot existente.

### 7.6 · Senha admin

- Comparação exata, case-sensitive, com `"Melina2026"`.

---

## 8. Modelo de dados

### 8.1 · Agendamento

```json
{
  "id": "ag_1747821234567_a8x2k",
  "tipo": "amigo",
  "data": "2026-06-20",
  "horario": "16:00",
  "nome": "Helena Ribeiro",
  "whatsapp": "(11) 99342-1188",
  "whatsappDigits": "11993421188",
  "email": "helena.ribeiro@gmail.com",
  "acompanhantes": ["Lucas Ribeiro", "Ana Beatriz Ribeiro"],
  "criadoEm": "2026-05-23T14:23:00.000Z",
  "messageSent": true,
  "inviteSent": true
}
```

| Campo            | Tipo                   | Origem                                                                    |
| ---------------- | ---------------------- | ------------------------------------------------------------------------- |
| `id`             | string                 | Gerado no front (`ag_<timestamp>_<rand>`). No backend real → ID do banco. |
| `tipo`           | `"amigo" \| "familia"` | Vem do passo 1 (ou derivado da data via `tipoDoDia`).                     |
| `data`           | `YYYY-MM-DD`           | Vem do slot escolhido no passo 2.                                         |
| `horario`        | `HH:MM`                | Vem do slot. Default `16:00`.                                             |
| `nome`           | string                 | Passo 3, após `trim()`.                                                   |
| `whatsapp`       | string formatado       | Passo 3 (máscara).                                                        |
| `whatsappDigits` | string (11)            | Derivado, chave única.                                                    |
| `email`          | string ou `""`         | Passo 3, opcional.                                                        |
| `acompanhantes`  | string[]               | Passo 4, filtrado por nomes não vazios.                                   |
| `criadoEm`       | ISO 8601               | `new Date().toISOString()`.                                               |
| `messageSent`    | bool                   | Simulado: sempre `true`.                                                  |
| `inviteSent`     | bool                   | Simulado: `true` se `email` termina em `@gmail.com`.                      |

### 8.2 · Slot

```json
{ "iso": "2026-06-20", "horario": "16:00" }
```

- `iso`: chave primária (única).
- `horario`: `HH:MM`.
- O tipo é derivado da data, não armazenado.

---

## 9. Cenários de erro & estados de borda

| Cenário                                         | Comportamento                                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Tentar confirmar com data já ocupada            | `criar()` lança erro; passo 5 mostra toast de erro vermelho.                                                |
| Tentar confirmar com WhatsApp duplicado         | Mesmo bloqueio. Mas no passo 3 isso já é evitado proativamente.                                             |
| Passo 2 sem nenhum slot do tipo                 | Card de empty state "Nenhum sábado/domingo disponível no momento" + helper "O admin pode abrir mais datas". |
| Alterar data para uma data já ocupada por outro | `atualizar()` lança erro `"Esta data já está ocupada"`.                                                     |
| OTP errado (no real, hoje aceita qualquer)      | Mensagem inline; botão de verificar fica desabilitado até 6 dígitos.                                        |
| MeuAgendamento: WhatsApp não cadastrado         | "Não encontramos um agendamento para este número."                                                          |
| Cancelar agendamento                            | Dialog de confirmação. Após cancelar, mostra estado "Agendamento cancelado" com CTA "Agendar nova visita".  |
| Admin: senha incorreta                          | "Senha incorreta. Tente novamente." Sem rate-limit (TODO).                                                  |
| Resetar dados                                   | Confirmação modal. Apaga storage e seeds, recria seeds no próximo carregamento.                             |
| Múltiplas instâncias na mesma página (canvas)   | Sincronização via `CustomEvent` + `storage` event.                                                          |

---

## 10. Dados de exemplo (seed)

### 10.1 · Slots padrão (`seedSlotsPadrao`)

- Base: **25/05/2026** (segunda-feira).
- Primeiro sábado: **30/05/2026**. Primeiro domingo: **31/05/2026**.
- 8 semanas, todos às 16:00 → 16 slots (8 sábados + 8 domingos).

### 10.2 · Agendamentos seed (`seedExemplos`) — 4 entradas

| Tipo    | Data             | Horário | Nome            | WhatsApp        | E-mail                    | Acompanhantes                          | GCal |
| ------- | ---------------- | ------- | --------------- | --------------- | ------------------------- | -------------------------------------- | ---- |
| amigo   | 2026-05-30 (sáb) | 16h     | Beatriz Andrade | (11) 99876-4521 | bia.andrade@gmail.com     | Camila Andrade                         | ✓    |
| família | 2026-06-07 (dom) | 16h     | Tia Cláudia     | (21) 99245-8810 | claudia.alves@hotmail.com | Tio Renato, Prima Júlia, Primo Gabriel | —    |
| amigo   | 2026-06-13 (sáb) | 16h     | Mariana Soares  | (11) 99432-1187 | (vazio)                   | —                                      | —    |
| família | 2026-06-21 (dom) | 16h     | Vovó Esther     | (11) 98765-3344 | estherbaranov@gmail.com   | Vovô Saul, Tia Helena                  | ✓    |

---

## 11. Configurações & tweaks

### 11.1 · Constantes ajustáveis

| Constante             | Local                           | Valor                 |
| --------------------- | ------------------------------- | --------------------- |
| `DATA_INICIAL`        | `utils/datas.js`                | `2026-05-25`          |
| `SEMANAS_DISPONIVEIS` | `utils/datas.js`                | `8`                   |
| `ADMIN_PASSWORD`      | `components/PainelAdmin.jsx`    | `"Melina2026"`        |
| `OTP_LENGTH`          | `components/MeuAgendamento.jsx` | `6`                   |
| `OTP_TESTE`           | `components/MeuAgendamento.jsx` | `"123456"` (sugerido) |

### 11.2 · Tweaks visuais (preview desktop)

- **Tamanho da tela** (`Fluxo Novo Agendamento Desktop.html`): alterna entre Mobile (frame de 420 px centralizado) e Computador (largura cheia, layout responsivo via container queries).

### 11.3 · Breakpoints responsivos

Definidos via container queries em `src/styles-responsive.css`, sobre o container `.vm-app`:

| Largura do container | Mudanças                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `< 720px`            | Layout mobile original.                                                                                                                  |
| `≥ 720px`            | Conteúdo centralizado em 720 px, tipografia +25%, cartões de tipo lado a lado, grade de datas em 3 colunas, footer com botões à direita. |
| `≥ 1024px`           | max-width 960 px, h1 48 px, grade de datas em 4 colunas, resumo da confirmação em 2 colunas.                                             |
| `≥ 1280px`           | max-width 1040 px.                                                                                                                       |

---

## 12. Pontos de integração (`TODO` no código)

Listagem de cada ponto que precisa virar chamada de API real:

| Onde                                     | O quê                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `useAgendamentos.criar`                  | `POST /agendamentos` — receber `messageSent` + `inviteSent` reais do backend.  |
| `useAgendamentos.atualizar`              | `PATCH /agendamentos/:id`.                                                     |
| `useAgendamentos.cancelar`               | `DELETE /agendamentos/:id` (que também cancela o invite no Google Calendar).   |
| `useSlots.*`                             | `GET/POST/PUT/DELETE /slots`.                                                  |
| `MeuAgendamento.handleEnviarCodigo`      | `POST /otp/enviar { whatsapp }`.                                               |
| `MeuAgendamento.handleVerificarOTP`      | `POST /otp/verificar { whatsapp, codigo }`.                                    |
| `MeuAgendamento.handleReenviar`          | `POST /otp/reenviar { whatsapp }`.                                             |
| `useValidacaoWhatsApp`                   | Integrar com API de validação de número WhatsApp real (atualmente só formato). |
| `PainelAdmin.handleLogin`                | Autenticação real (JWT/cookie), proteção contra brute-force.                   |
| `StepDadosPessoais`                      | Validação de número WhatsApp em tempo real (API).                              |
| `StepDadosPessoais`                      | Envio de e-mail/convite via Google Calendar API (no submit).                   |
| `utils/datas.js → gerarDatasDisponiveis` | Trazer horários reais por dia (variáveis), não fixo `16:00`.                   |
