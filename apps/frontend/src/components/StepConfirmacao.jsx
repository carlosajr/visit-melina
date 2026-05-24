// components/StepConfirmacao.jsx — Passo 5: resumo + botão confirmar

import { IconArrowL, IconCheck, IconX } from './Decoracao';
import { ProgressIndicator } from './ProgressIndicator';
import { formatarDataExtensa, formatarHorario } from '../utils/datas';

function Row({ k, v, onEdit }) {
  return (
    <div className="vm-sum-row">
      <span className="vm-sum-key">{k}</span>
      <span className="vm-sum-val">
        {v}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              marginLeft: 8, fontSize: 11.5, color: 'var(--muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3,
              fontFamily: 'inherit',
            }}
          >editar</button>
        )}
      </span>
    </div>
  );
}

export function StepConfirmacao({ valor, onConfirmar, onBack, onEditar, salvando, erro }) {
  const tipoLabel = valor.tipo === 'amigo' ? 'Sou Amigo' : 'Sou Família';
  const acomp = (valor.acompanhantes || []).filter((n) => n.trim());

  return (
    <div className="vm-screen">
      <button type="button" className="vm-back" onClick={onBack}>
        <IconArrowL color="var(--ink-soft)"/> Voltar
      </button>
      <ProgressIndicator step={5} total={5} labels={['Tipo', 'Data', 'Dados', 'Acompanhantes', 'Confirmação']} />
      <div>
        <h2 className="vm-h2">Tudo certinho?</h2>
        <p className="vm-lede" style={{ marginTop: 6 }}>
          Confirme os detalhes da sua visita.
        </p>
      </div>

      <div className="vm-card">
        <div className="vm-sum-list">
          <Row k="Tipo" v={
            <span className={`vm-pill ${valor.tipo === 'amigo' ? 'is-amigo' : 'is-familia'}`}>
              {tipoLabel} {valor.tipo === 'amigo' ? '🌸' : '🍯'}
            </span>
          } onEdit={() => onEditar('tipo')}/>
          <Row k="Data" v={`${formatarDataExtensa(valor.data)} · ${formatarHorario(valor.horario || '16:00')}`} onEdit={() => onEditar('data')}/>
          <Row k="Nome" v={valor.nome} onEdit={() => onEditar('dados')}/>
          <Row k="WhatsApp" v={valor.whatsapp} onEdit={() => onEditar('dados')}/>
          {valor.email && <Row k="E-mail" v={valor.email} onEdit={() => onEditar('dados')}/>}
          <Row k="Acompanhantes" v={
            acomp.length === 0
              ? <span style={{ color: 'var(--muted)', fontWeight: 600 }}>nenhum</span>
              : acomp.join(', ')
          } onEdit={() => onEditar('acompanhantes')}/>
        </div>
      </div>

      {erro && (
        <div className="vm-toast is-info" style={{ background: 'var(--danger-bg)', borderColor: '#E9B5AC', color: 'var(--danger)' }}>
          <span className="vm-toast-icon"><IconX color="var(--danger)"/></span>
          <div className="vm-toast-body"><b>Não foi possível agendar</b>{erro}</div>
        </div>
      )}

      <div className="vm-step-footer">
        <button type="button" className="vm-btn vm-btn-secondary" onClick={onBack}>Voltar</button>
        <button
          type="button"
          className="vm-btn vm-btn-primary vm-btn-block"
          disabled={salvando}
          onClick={onConfirmar}
        >
          {salvando ? 'Confirmando…' : (<>Confirmar visita <IconCheck color="#fff"/></>)}
        </button>
      </div>
    </div>
  );
}
