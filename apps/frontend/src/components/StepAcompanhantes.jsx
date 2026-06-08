// components/StepAcompanhantes.jsx — Passo 4: lista de acompanhantes opcionais

import { IconArrowL, IconChev, IconX, IconPlus, IconFlower } from './Decoracao';
import { ProgressIndicator } from './ProgressIndicator';

export function StepAcompanhantes({ valor, onChange, onContinue, onBack }) {
  const acomp = valor.acompanhantes;

  const setAt = (i, novo) => {
    const list = [...acomp];
    list[i] = novo;
    onChange({ ...valor, acompanhantes: list });
  };

  const remover = (i) => {
    const list = acomp.filter((_, idx) => idx !== i);
    onChange({ ...valor, acompanhantes: list });
  };

  const adicionar = () => {
    onChange({ ...valor, acompanhantes: [...acomp, ''] });
  };

  return (
    <div className="vm-screen">
      <button type="button" className="vm-back" onClick={onBack}>
        <IconArrowL color="var(--ink-soft)"/> Voltar
      </button>
      <ProgressIndicator step={3} total={4} labels={['Data', 'Dados', 'Acompanhantes', 'Confirmação']} />
      <div>
        <h2 className="vm-h2">Vai trazer mais alguém?</h2>
        <p className="vm-lede" style={{ marginTop: 6 }}>
          Quem mais vem com você? <span style={{ color: 'var(--muted)' }}>Opcional — pode pular.</span>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {acomp.length === 0 && (
          <div className="vm-card vm-card-soft vm-empty">
            <IconFlower size={32} petal="var(--rose-deep)" center="var(--honey)"/>
            <div>Ninguém adicionado ainda.</div>
          </div>
        )}
        {acomp.map((nome, i) => (
          <div key={i} className="vm-companion-row">
            <input
              type="text"
              className="vm-input"
              placeholder={`Nome do acompanhante ${i + 1}`}
              value={nome}
              onChange={(e) => setAt(i, e.target.value)}
              autoFocus={nome === ''}
            />
            <button type="button" className="vm-companion-remove" aria-label="Remover" onClick={() => remover(i)}>
              <IconX size={16} color="var(--rose-deep)"/>
            </button>
          </div>
        ))}
        <button type="button" className="vm-add-row" onClick={adicionar}>
          <IconPlus color="var(--ink-soft)"/> Adicionar acompanhante
        </button>
      </div>

      <div className="vm-step-footer">
        <button type="button" className="vm-btn vm-btn-secondary" onClick={onBack}>
          Voltar
        </button>
        <button type="button" className="vm-btn vm-btn-primary vm-btn-block" onClick={onContinue}>
          Continuar <IconChev color="#fff"/>
        </button>
      </div>
    </div>
  );
}
