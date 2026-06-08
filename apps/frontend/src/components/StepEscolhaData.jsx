// components/StepEscolhaData.jsx — Passo 2: escolha de data
// Datas + horários vêm do useSlots() (gerenciados pelo admin).

import { IconArrowL, IconHexOutline } from './Decoracao';
import { ProgressIndicator } from './ProgressIndicator';
import { useSlots } from '../hooks/useSlots';
import { formatarHorario, diaSemana, nomeMesCurto } from '../utils/datas';

export function StepEscolhaData({ valor, onSelect, onBack, datasOcupadas, ignorarOcupacaoData }) {
  const { slotsOrdenados, carregando } = useSlots();
  const slots = slotsOrdenados();

  const cabecalho = (
    <>
      <button type="button" className="vm-back" onClick={onBack}>
        <IconArrowL color="var(--ink-soft)"/> Voltar
      </button>
      <ProgressIndicator step={1} total={4} labels={['Data', 'Dados', 'Acompanhantes', 'Confirmação']} />
      <div>
        <div className="vm-eyebrow">Visitas aos sábados</div>
        <h2 className="vm-h2" style={{ marginTop: 6 }}>Escolha um dia para visitar</h2>
        <p className="vm-lede" style={{ marginTop: 6 }}>
          Dias em cinza já estão ocupados. Toque em um cartão livre para continuar.
        </p>
      </div>
    </>
  );

  if (carregando) {
    return (
      <div className="vm-screen">
        {cabecalho}
        <div className="vm-date-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="vm-date-card" style={{ pointerEvents: 'none', minHeight: 88 }}>
              <span className="vm-skeleton" style={{ height: 10, width: '38%' }}/>
              <span className="vm-skeleton" style={{ height: 26, width: '55%', margin: '7px 0 2px' }}/>
              <span className="vm-skeleton" style={{ height: 10, width: '48%', marginTop: 6 }}/>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="vm-screen">
      {cabecalho}

      {slots.length === 0 ? (
        <div className="vm-card vm-card-soft vm-empty">
          <IconHexOutline size={32} color="var(--muted)"/>
          <div>Nenhum sábado disponível no momento.</div>
        </div>
      ) : (
        <div className="vm-date-grid">
          {slots.map((slot) => {
            const { iso, horario } = slot;
            const d = new Date(iso + 'T00:00:00');
            const ocupada = !ignorarOcupacaoData?.has?.(iso) && datasOcupadas.has(iso);
            const desbloqueada = ignorarOcupacaoData?.has?.(iso);
            const selected = valor === iso;
            return (
              <button
                key={iso}
                type="button"
                disabled={ocupada}
                className={[
                  'vm-date-card',
                  selected && 'is-selected',
                  ocupada && 'is-disabled',
                ].filter(Boolean).join(' ')}
                onClick={() => !ocupada && onSelect(iso, horario)}
              >
                <span className="vm-dc-month">{nomeMesCurto(d)}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="vm-dc-day">{d.getDate()}</span>
                  <span className="vm-dc-time">{formatarHorario(horario)}</span>
                </div>
                <span className="vm-dc-weekday">{diaSemana(d)}{desbloqueada && !ocupada ? ' · sua data' : ''}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="vm-helper" style={{ textAlign: 'center' }}>
        Não encontrou um dia? O admin pode abrir mais datas no painel.
      </p>
    </div>
  );
}
