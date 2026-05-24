// components/StepDadosPessoais.jsx — Passo 3: nome + WhatsApp + e-mail

import { useState, useEffect, useRef } from 'react';
import { IconArrowL, IconChev, IconCheck, IconX, IconCalendar, IconHeart } from './Decoracao';
import { ProgressIndicator } from './ProgressIndicator';
import { useValidacaoWhatsApp } from '../hooks/useValidacaoWhatsApp';
import { mascararWhatsApp, validarEmail, isGmail } from '../utils/mascaras';

export function StepDadosPessoais({ valor, onChange, onContinue, onBack, checkWhatsapp, onIrParaMeuAgendamento }) {
  const validacaoWpp = useValidacaoWhatsApp(valor.whatsapp);
  const emailLimpo = String(valor.email || '').trim();
  const emailValido = !emailLimpo || validarEmail(emailLimpo);
  const emailIsGmail = isGmail(emailLimpo);
  const emailVazio = emailLimpo.length === 0;

  const [duplicado, setDuplicado] = useState(false);
  const timerRef = useRef(null);

  // Debounce da checagem de whatsapp na API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!validacaoWpp.valido) { setDuplicado(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const existe = await checkWhatsapp(valor.whatsapp);
      setDuplicado(existe);
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [valor.whatsapp, validacaoWpp.valido, checkWhatsapp]);

  const podeContinuar =
    valor.nome.trim().length >= 2 &&
    validacaoWpp.valido &&
    !duplicado &&
    emailValido;

  const handleWpp = (e) => {
    onChange({ ...valor, whatsapp: mascararWhatsApp(e.target.value) });
    setDuplicado(false);
  };

  return (
    <div className="vm-screen">
      <button type="button" className="vm-back" onClick={onBack}>
        <IconArrowL color="var(--ink-soft)"/> Voltar
      </button>
      <ProgressIndicator step={3} total={5} labels={['Tipo', 'Data', 'Dados', 'Acompanhantes', 'Confirmação']} />
      <div>
        <h2 className="vm-h2">Conta um pouquinho sobre você</h2>
        <p className="vm-lede" style={{ marginTop: 6 }}>
          Vamos avisar quando der tudo certo pelo WhatsApp.
        </p>
      </div>

      <div className="vm-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="vm-label" htmlFor="vm-nome">Nome completo</label>
          <input
            id="vm-nome"
            type="text"
            className="vm-input"
            placeholder="Como você gostaria de ser chamado?"
            value={valor.nome}
            onChange={(e) => onChange({ ...valor, nome: e.target.value })}
          />
        </div>

        <div>
          <label className="vm-label" htmlFor="vm-wpp">WhatsApp</label>
          <div className="vm-input-wrap">
            <input
              id="vm-wpp"
              type="tel"
              inputMode="numeric"
              className={[
                'vm-input',
                validacaoWpp.valido && !duplicado && 'is-valid',
                (validacaoWpp.estado === 'invalido' || duplicado) && 'is-invalid',
              ].filter(Boolean).join(' ')}
              placeholder="(11) 99999-9999"
              value={valor.whatsapp}
              onChange={handleWpp}
              maxLength={16}
            />
            {validacaoWpp.valido && !duplicado && (
              <span className="vm-validity is-valid" aria-label="Número válido"><IconCheck color="var(--success)"/></span>
            )}
            {(validacaoWpp.estado === 'invalido' || duplicado) && (
              <span className="vm-validity is-invalid" aria-label="Número inválido"><IconX color="var(--danger)"/></span>
            )}
          </div>
          {validacaoWpp.mensagem && <p className="vm-error">{validacaoWpp.mensagem}</p>}
        </div>

        {duplicado && (
          <div className="vm-toast is-info">
            <span className="vm-toast-icon"><IconHeart color="var(--rose-deep)"/></span>
            <div className="vm-toast-body">
              <b>Este número já tem agendamento.</b>
              Você quer ver ou alterar a sua visita?
              <div style={{ marginTop: 10 }}>
                <button type="button" className="vm-btn vm-btn-secondary" onClick={() => onIrParaMeuAgendamento(valor.whatsapp)}>
                  Ver meu agendamento
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="vm-label" htmlFor="vm-email">
            E-mail <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(opcional)</span>
          </label>
          <div className="vm-input-wrap">
            <input
              id="vm-email"
              type="email"
              className={[
                'vm-input',
                !emailVazio && emailValido && 'is-valid',
                !emailVazio && !emailValido && 'is-invalid',
              ].filter(Boolean).join(' ')}
              placeholder="seuemail@exemplo.com"
              value={valor.email}
              onChange={(e) => onChange({ ...valor, email: e.target.value })}
            />
            {!emailVazio && emailValido && (
              <span className="vm-validity is-valid"><IconCheck color="var(--success)"/></span>
            )}
            {!emailVazio && !emailValido && (
              <span className="vm-validity is-invalid"><IconX color="var(--danger)"/></span>
            )}
          </div>
          {!emailVazio && !emailValido && <p className="vm-error">E-mail em formato inválido</p>}
          {emailIsGmail && emailValido && (
            <p className="vm-helper" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--honey-deep)', fontWeight: 700 }}>
              <IconCalendar size={13} color="var(--honey-deep)"/>
              Vamos enviar um convite pro seu Google Calendar.
            </p>
          )}
        </div>
      </div>

      <div className="vm-step-footer">
        <button type="button" className="vm-btn vm-btn-secondary" onClick={onBack}>
          Voltar
        </button>
        <button type="button" className="vm-btn vm-btn-primary vm-btn-block" disabled={!podeContinuar} onClick={onContinue}>
          Continuar <IconChev color="#fff"/>
        </button>
      </div>
    </div>
  );
}
