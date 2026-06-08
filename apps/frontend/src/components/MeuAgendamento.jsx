// components/MeuAgendamento.jsx — busca → OTP → visualizar/alterar/cancelar

import { useState, useEffect } from 'react';
import {
  VMBrand, IconArrowL, IconCheck, IconWpp,
  IconCalendar, IconFlower, IconTrash,
} from './Decoracao';
import { useAgendamentos } from '../hooks/useAgendamentos';
import { useValidacaoWhatsApp } from '../hooks/useValidacaoWhatsApp';
import { mascararWhatsApp } from '../utils/mascaras';
import { formatarDataExtensa, formatarHorario } from '../utils/datas';
import { api, apiVisitor, setVisitorToken } from '../api/client';

const OTP_LENGTH = 6;

function Row({ k, v }) {
  return (
    <div className="vm-sum-row">
      <span className="vm-sum-key">{k}</span>
      <span className="vm-sum-val">{v}</span>
    </div>
  );
}

function CodeCountdown({ desde, total = 60 }) {
  const [restante, setRestante] = useState(total);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRestante(total);
    const t = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [desde, total]);

  if (restante === 0) return <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Não recebeu? Reenvie acima.</span>;
  return <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Reenviar em {restante}s</span>;
}

export function MeuAgendamento({
  onVoltarHome,
  onIrParaAlterarData,
  agendamentoPreCarregado,
  busca: buscaInicial,
  pularOTP = false,
}) {
  const { cancelar } = useAgendamentos();

  const etapaInicial = agendamentoPreCarregado && pularOTP ? 'view' : agendamentoPreCarregado ? 'otp' : 'busca';

  const [etapa, setEtapa] = useState(etapaInicial);
  const [busca, setBusca] = useState(buscaInicial || agendamentoPreCarregado?.whatsapp || '');
  const [resultado, setResultado] = useState(agendamentoPreCarregado || null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [otpCodigo, setOtpCodigo] = useState('');
  const [otpErro, setOtpErro] = useState('');
  const [otpReenviadoEm, setOtpReenviadoEm] = useState(() => Date.now());
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [cancelado, setCancelado] = useState(false);

  const validacao = useValidacaoWhatsApp(busca);

  useEffect(() => {
    if (agendamentoPreCarregado) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResultado(agendamentoPreCarregado);
      setBusca(agendamentoPreCarregado.whatsapp);
      setEtapa(pularOTP ? 'view' : 'otp');
    }
  }, [agendamentoPreCarregado, pularOTP]);

  const handleEnviarCodigo = async () => {
    if (!validacao.valido) { setErro('Digite um número de WhatsApp válido'); return; }
    setErro('');
    setCarregando(true);
    try {
      const digits = busca.replace(/\D/g, '');
      const res = await api('/otp/enviar', {
        method: 'POST',
        body: JSON.stringify({ whatsapp: digits }),
      });
      if (!res?.enviado) {
        setErro(res?.motivo === 'Agendamento não encontrado'
          ? 'Não encontramos agendamento com esse número.'
          : 'Não foi possível enviar o código. Tente novamente.');
        return;
      }
      setOtpCodigo('');
      setOtpErro('');
      setOtpReenviadoEm(Date.now());
      setEtapa('otp');
    } catch {
      setErro('Não encontramos agendamento com esse número.');
    } finally {
      setCarregando(false);
    }
  };

  const handleVerificarOTP = async () => {
    if (otpCodigo.length !== OTP_LENGTH) { setOtpErro(`Digite os ${OTP_LENGTH} dígitos`); return; }
    if (!/^\d+$/.test(otpCodigo)) { setOtpErro('Apenas números'); return; }
    setOtpErro('');
    setCarregando(true);
    try {
      const digits = busca.replace(/\D/g, '');
      const res = await api('/otp/verificar', {
        method: 'POST',
        body: JSON.stringify({ whatsapp: digits, codigo: otpCodigo }),
      });
      if (!res?.accessToken) { setOtpErro('Código incorreto. Tente novamente.'); return; }
      setVisitorToken(res.accessToken);
      // Busca agendamento com o token obtido
      const ag = await apiVisitor('/agendamentos/meu');
      setResultado(ag);
      setEtapa('view');
    } catch (e) {
      setOtpErro(e.message === 'Código incorreto' ? 'Código incorreto. Tente novamente.' : 'Código expirado ou inválido.');
    } finally {
      setCarregando(false);
    }
  };

  const handleReenviar = async () => {
    setOtpCodigo('');
    setOtpErro('');
    setCarregando(true);
    try {
      const digits = busca.replace(/\D/g, '');
      await api('/otp/reenviar', {
        method: 'POST',
        body: JSON.stringify({ whatsapp: digits }),
      });
      setOtpReenviadoEm(Date.now());
    } catch {
      setOtpErro('Falha ao reenviar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelar = async () => {
    setCarregando(true);
    try {
      await cancelar(resultado.id, resultado.data);
      setCancelado(true);
      setConfirmarCancelar(false);
    } catch {
      setErro('Não foi possível cancelar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  if (cancelado) {
    return (
      <div className="vm-screen">
        <VMBrand />
        <div className="vm-success-hero" style={{ background: 'linear-gradient(180deg, var(--rose-soft) 0%, var(--card-soft) 100%)' }}>
          <IconFlower size={36} petal="var(--rose-deep)" center="var(--honey)"/>
          <h1 className="vm-h1">Até a próxima 💛</h1>
          <p className="vm-lede" style={{ maxWidth: 280 }}>
            Seu agendamento foi cancelado. Quando quiser, a porta da Melina segue aberta.
          </p>
        </div>
        <button className="vm-btn vm-btn-primary vm-btn-block" onClick={onVoltarHome}>Voltar ao início</button>
      </div>
    );
  }

  if (etapa === 'busca') {
    return (
      <div className="vm-screen">
        <button type="button" className="vm-back" onClick={onVoltarHome}>
          <IconArrowL color="var(--ink-soft)"/> Voltar
        </button>
        <VMBrand />
        <div>
          <div className="vm-eyebrow">Já tenho agendamento</div>
          <h2 className="vm-h2" style={{ marginTop: 6 }}>Ver minha visita</h2>
          <p className="vm-lede" style={{ marginTop: 6 }}>
            Digite o WhatsApp do agendamento — enviaremos um código por mensagem para confirmar.
          </p>
        </div>
        <div className="vm-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="vm-label" htmlFor="vm-busca">WhatsApp do agendamento</label>
            <div className="vm-input-wrap">
              <input
                id="vm-busca"
                type="tel"
                inputMode="numeric"
                className={['vm-input', validacao.valido && 'is-valid', validacao.estado === 'invalido' && 'is-invalid'].filter(Boolean).join(' ')}
                placeholder="(11) 99999-9999"
                value={busca}
                onChange={(e) => { setBusca(mascararWhatsApp(e.target.value)); setErro(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEnviarCodigo(); }}
                maxLength={16}
              />
              {validacao.valido && <span className="vm-validity is-valid"><IconCheck color="var(--success)"/></span>}
            </div>
          </div>
          {erro && <p className="vm-error">{erro}</p>}
          <button className="vm-btn vm-btn-primary" disabled={!validacao.valido || carregando} onClick={handleEnviarCodigo}>
            <IconWpp color="#fff"/> {carregando ? 'Enviando…' : 'Enviar código por WhatsApp'}
          </button>
        </div>
      </div>
    );
  }

  if (etapa === 'otp') {
    return (
      <div className="vm-screen">
        <button type="button" className="vm-back" onClick={() => setEtapa('busca')}>
          <IconArrowL color="var(--ink-soft)"/> Voltar
        </button>
        <VMBrand />
        <div>
          <div className="vm-eyebrow">Verificação</div>
          <h2 className="vm-h2" style={{ marginTop: 6 }}>Digite o código</h2>
          <p className="vm-lede" style={{ marginTop: 6 }}>
            Enviamos um código de {OTP_LENGTH} dígitos por WhatsApp para <b>{busca}</b>.
          </p>
        </div>
        <div className="vm-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="vm-label" htmlFor="vm-otp">Código de verificação</label>
            <input
              id="vm-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={['vm-input', 'vm-otp-input', otpCodigo.length === OTP_LENGTH && 'is-valid', otpErro && 'is-invalid'].filter(Boolean).join(' ')}
              placeholder="••••••"
              value={otpCodigo}
              onChange={(e) => { setOtpCodigo(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)); setOtpErro(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && otpCodigo.length === OTP_LENGTH) handleVerificarOTP(); }}
              maxLength={OTP_LENGTH}
              autoFocus
            />
            {otpErro && <p className="vm-error">{otpErro}</p>}
          </div>
          <button className="vm-btn vm-btn-primary" disabled={otpCodigo.length !== OTP_LENGTH || carregando} onClick={handleVerificarOTP}>
            {carregando ? 'Verificando…' : <><IconCheck color="#fff"/> Verificar</>}
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
            <button
              type="button"
              onClick={handleReenviar}
              disabled={carregando}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontFamily: 'inherit', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Reenviar código
            </button>
            <CodeCountdown desde={otpReenviadoEm}/>
          </div>
        </div>
      </div>
    );
  }

  // etapa === 'view'
  return (
    <div className="vm-screen">
      <button type="button" className="vm-back" onClick={onVoltarHome}>
        <IconArrowL color="var(--ink-soft)"/> Voltar
      </button>
      <VMBrand />
      <div>
        <div className="vm-eyebrow">Sua visita</div>
        <h2 className="vm-h2" style={{ marginTop: 6 }}>Olá, {resultado.nome.split(' ')[0]} 🌸</h2>
        <p className="vm-lede" style={{ marginTop: 6 }}>Confira os detalhes do seu agendamento.</p>
      </div>

      <div className="vm-card">
        {resultado.inviteSent && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
            <span className="vm-pill is-gcal"><IconCalendar size={12}/> &nbsp;Google Calendar</span>
          </div>
        )}
        <div className="vm-sum-list">
          <Row k="Data" v={`${formatarDataExtensa(resultado.data)} · ${formatarHorario(resultado.horario || '16:00')}`}/>
          <Row k="Nome" v={resultado.nome}/>
          <Row k="WhatsApp" v={resultado.whatsapp}/>
          {resultado.email && <Row k="E-mail" v={resultado.email}/>}
          <Row k="Acompanhantes" v={
            (resultado.acompanhantes || []).length === 0
              ? <span style={{ color: 'var(--muted)', fontWeight: 600 }}>nenhum</span>
              : resultado.acompanhantes.join(', ')
          }/>
        </div>
      </div>

      {erro && <p className="vm-error" style={{ textAlign: 'center' }}>{erro}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="vm-btn vm-btn-primary vm-btn-block" onClick={() => onIrParaAlterarData(resultado)}>
          <IconCalendar color="#fff"/> Alterar data
        </button>
        <button className="vm-btn vm-btn-danger vm-btn-block" onClick={() => setConfirmarCancelar(true)}>
          <IconTrash color="var(--danger)"/> Cancelar agendamento
        </button>
      </div>

      {confirmarCancelar && (
        <div className="vm-dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setConfirmarCancelar(false); }}>
          <div className="vm-dialog">
            <h3>Cancelar agendamento?</h3>
            <p>Vamos sentir saudades, mas a porta da Melina continua aberta. Tem certeza que quer cancelar a visita do dia {formatarDataExtensa(resultado.data)}?</p>
            <div className="vm-dialog-actions">
              <button className="vm-btn vm-btn-secondary" onClick={() => setConfirmarCancelar(false)}>Voltar</button>
              <button className="vm-btn vm-btn-danger" disabled={carregando} onClick={handleCancelar}>
                {carregando ? 'Cancelando…' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
