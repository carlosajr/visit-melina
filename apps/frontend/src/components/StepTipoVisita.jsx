// components/StepTipoVisita.jsx — Passo 1: escolha entre Amigo e Família

import { VMBrand, IconFlower, IconHeart, IconChev, IconDrop, IconHexOutline, IconHex } from './Decoracao';
import { ProgressIndicator } from './ProgressIndicator';

export function StepTipoVisita({ valor, onSelect, onBack }) {
  return (
    <div className="vm-screen">
      <VMBrand />
      <ProgressIndicator step={1} total={5} labels={['Tipo', 'Data', 'Dados', 'Acompanhantes', 'Confirmação']} />
      <div>
        <div className="vm-eyebrow">Novo agendamento</div>
        <h1 className="vm-h1" style={{ marginTop: 6 }}>Quem vem visitar a Melina?</h1>
        <p className="vm-lede" style={{ marginTop: 8 }}>
          Para o aconchego de todos, recebemos amigos aos <b>sábados</b> e família aos <b>domingos</b>.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          className={`vm-choice${valor === 'amigo' ? ' is-selected' : ''}`}
          onClick={() => onSelect('amigo')}
        >
          <span className="vm-choice-icon is-rose"><IconFlower size={26} petal="var(--rose-deep)" center="var(--honey)"/></span>
          <span className="vm-choice-body">
            <span className="vm-choice-title">Sou amigo <IconHeart size={14} color="var(--rose-deep)"/></span>
            <span className="vm-choice-sub">Visitas aos sábados</span>
          </span>
          <span className="vm-choice-chev"><IconChev color="var(--muted)"/></span>
        </button>

        <button
          type="button"
          className={`vm-choice${valor === 'familia' ? ' is-selected' : ''}`}
          onClick={() => onSelect('familia')}
        >
          <span className="vm-choice-icon is-honey"><IconHex size={24} fill="var(--honey-deep)"/></span>
          <span className="vm-choice-body">
            <span className="vm-choice-title">Sou família <IconDrop size={14} color="var(--honey-deep)"/></span>
            <span className="vm-choice-sub">Visitas aos domingos</span>
          </span>
          <span className="vm-choice-chev"><IconChev color="var(--muted)"/></span>
        </button>
      </div>

      <div className="vm-card vm-card-soft" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ marginTop: 1 }}><IconHexOutline size={18} color="var(--honey-deep)"/></span>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.45 }}>
          Organizamos tudo com carinho para que cada visita à Melina seja leve, especial e cheia de afeto.
        </div>
      </div>

      {onBack && (
        <div className="vm-step-footer">
          <button type="button" className="vm-btn vm-btn-secondary vm-btn-block" onClick={onBack}>
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
