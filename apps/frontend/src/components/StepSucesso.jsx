// components/StepSucesso.jsx — tela final após criar agendamento

import { VMBrand, IconFlower, IconHex, IconWpp, IconCalendar, HoneycombBackdrop } from './Decoracao';
import { formatarDataExtensa, formatarHorario } from '../utils/datas';

export function StepSucesso({ agendamento, onVoltarHome, onVerAgendamento }) {
  // messageSent / inviteSent vêm do retorno simulado do backend.
  // TODO: exibir estes avisos apenas com base na resposta real da API.
  const messageSent = !!agendamento.messageSent;
  const inviteSent = !!agendamento.inviteSent;

  return (
    <div className="vm-screen">
      <VMBrand />

      <div className="vm-success-hero">
        <HoneycombBackdrop opacity={0.18} color="var(--honey)"/>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <IconFlower size={34} petal="var(--rose-deep)" center="var(--honey)"/>
          <IconHex size={26} fill="var(--honey)"/>
          <IconFlower size={28} petal="var(--sage-deep)" center="var(--honey-deep)"/>
        </div>
        <h1 className="vm-h1" style={{ position: 'relative', marginTop: 4 }}>
          Que alegria!
        </h1>
        <p className="vm-lede" style={{ position: 'relative', maxWidth: 280 }}>
          A Melina vai adorar te receber 🌸
        </p>
        <div style={{
          marginTop: 4, position: 'relative',
          fontWeight: 700, color: 'var(--ink)', fontSize: 14,
          background: 'rgba(255,255,255,0.6)', padding: '8px 14px', borderRadius: 99,
        }}>
          {formatarDataExtensa(agendamento.data)} · {formatarHorario(agendamento.horario || '16:00')}
        </div>
      </div>

      {/* Confirmação WhatsApp — exibido apenas quando o backend confirma messageSent */}
      {messageSent ? (
        <div className="vm-toast is-wpp">
          <span className="vm-toast-icon"><IconWpp color="#2F6A45"/></span>
          <div className="vm-toast-body">
            <b>Mensagem enviada no WhatsApp</b>
            Confirmação enviada para {agendamento.whatsapp}.
          </div>
        </div>
      ) : (
        <div className="vm-toast is-info">
          <span className="vm-toast-icon"><IconWpp color="var(--muted)"/></span>
          <div className="vm-toast-body">
            <b>WhatsApp não enviado</b>
            Estamos tentando novamente — você receberá em instantes.
          </div>
        </div>
      )}

      {/* Convite Google Calendar — apenas quando inviteSent=true vindo do backend */}
      {/* TODO: exibir apenas se o back-end retornar confirmação de criação do invite */}
      {inviteSent && (
        <div className="vm-toast is-gcal">
          <span className="vm-toast-icon"><IconCalendar color="var(--honey-deep)"/></span>
          <div className="vm-toast-body">
            <b>Convite adicionado ao Google Calendar 📅</b>
            Confira sua agenda em {agendamento.email}.
          </div>
        </div>
      )}

      {agendamento.acompanhantes.length > 0 && (
        <div className="vm-card vm-card-soft">
          <div className="vm-eyebrow">Acompanhantes</div>
          <div style={{ marginTop: 8, fontSize: 14.5, fontWeight: 700, lineHeight: 1.5 }}>
            {agendamento.acompanhantes.join(' · ')}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <button type="button" className="vm-btn vm-btn-honey vm-btn-block" onClick={onVerAgendamento}>
          Ver meu agendamento
        </button>
        <button type="button" className="vm-btn vm-btn-secondary vm-btn-block" onClick={onVoltarHome}>
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
