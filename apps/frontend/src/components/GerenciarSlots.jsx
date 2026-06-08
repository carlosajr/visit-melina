// components/GerenciarSlots.jsx — admin: cadastrar/editar/remover slots

import { useState, useMemo } from 'react';
import { IconPlus, IconX, IconTrash, IconCheck } from './Decoracao';
import { useSlots, isSabado } from '../hooks/useSlots';
import { formatarDataExtensa, formatarHorario, diaSemana } from '../utils/datas';

export function GerenciarSlots({ listaAgendamentos = [] }) {
  const slots = useSlots();
  const { carregando } = slots;
  const [erro, setErro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [novaData, setNovaData] = useState('');
  const [novoHorario, setNovoHorario] = useState('16:00');
  const [salvando, setSalvando] = useState(false);

  const ocupadosMap = useMemo(() => {
    const m = {};
    listaAgendamentos.forEach((a) => { m[a.data] = a; });
    return m;
  }, [listaAgendamentos]);

  const sabados = slots.slotsOrdenados();

  const abrirForm = () => {
    setErro('');
    setFormAberto(true);
    setNovaData('');
    setNovoHorario('16:00');
  };

  const fecharForm = () => {
    setFormAberto(false);
    setNovaData('');
    setNovoHorario('16:00');
    setErro('');
  };

  const confirmarAdicionar = async () => {
    if (!novaData) { setErro('Escolha uma data.'); return; }
    if (!isSabado(novaData)) { setErro('A data deve ser um sábado.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await slots.criar(novaData, novoHorario);
      fecharForm();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const editarData = async (slot, novaIso) => {
    setErro('');
    if (!novaIso) return;
    if (!isSabado(novaIso)) { setErro('A data deve ser um sábado.'); return; }
    try { await slots.atualizar(slot.id, { iso: novaIso }); }
    catch (e) { setErro(e.message); }
  };

  const editarHorario = async (slot, novoH) => {
    setErro('');
    if (!novoH) return;
    try { await slots.atualizar(slot.id, { horario: novoH }); }
    catch (e) { setErro(e.message); }
  };

  const remover = async (slot) => {
    const ocupado = ocupadosMap[slot.iso];
    const msg = ocupado
      ? `Atenção: existe um agendamento neste dia (${ocupado.nome}). Remover o slot vai deixar o agendamento "órfão". Continuar?`
      : `Remover ${formatarDataExtensa(slot.iso)} · ${formatarHorario(slot.horario)}?`;
    if (!confirm(msg)) return;
    try { await slots.remover(slot.id); }
    catch (e) { setErro(e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="vm-eyebrow">Datas disponíveis</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
            {slots.lista.length} slot{slots.lista.length === 1 ? '' : 's'} cadastrado{slots.lista.length === 1 ? '' : 's'}
          </h3>
        </div>
      </div>

      {erro && (
        <div className="vm-toast is-info" style={{ background: 'var(--danger-bg)', borderColor: '#E9B5AC', color: 'var(--danger)', marginBottom: 14 }}>
          <span className="vm-toast-icon"><IconX color="var(--danger)"/></span>
          <div className="vm-toast-body"><b>Não foi possível salvar.</b> {erro}</div>
        </div>
      )}

      {/* Formulário de novo slot */}
      {formAberto && (
        <div className="vm-card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
              Novo slot · 🌸 Sábado
            </span>
            <button
              type="button"
              onClick={fecharForm}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <IconX color="var(--muted)"/>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label className="vm-label" style={{ marginBottom: 4, display: 'block' }}>Data</label>
              <input
                type="date"
                className="vm-input"
                value={novaData}
                onChange={(e) => { setNovaData(e.target.value); setErro(''); }}
                autoFocus
              />
            </div>
            <div style={{ flex: '0 0 110px' }}>
              <label className="vm-label" style={{ marginBottom: 4, display: 'block' }}>Horário</label>
              <input
                type="time"
                className="vm-input"
                value={novoHorario}
                step="900"
                onChange={(e) => setNovoHorario(e.target.value)}
              />
            </div>
            <button
              className="vm-btn vm-btn-primary"
              style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}
              onClick={confirmarAdicionar}
              disabled={!novaData || salvando}
            >
              {salvando ? 'Salvando…' : <><IconCheck color="#fff"/> Salvar</>}
            </button>
          </div>

          {novaData && !isSabado(novaData) && (
            <p className="vm-error" style={{ margin: 0 }}>Esta data não é um sábado.</p>
          )}
        </div>
      )}

      <SlotsSection
        titulo="Sábados" pillClass="is-amigo" emoji="🌸"
        slots={sabados} ocupadosMap={ocupadosMap} carregando={carregando}
        adicionarAberto={formAberto}
        onAdicionar={abrirForm}
        onEditarData={editarData} onEditarHorario={editarHorario} onRemover={remover}
      />

      <p className="vm-helper" style={{ marginTop: 8, fontSize: 11.5 }}>
        Apenas <b>sábados</b> podem ser cadastrados.
      </p>
    </div>
  );
}

function SlotsSection({ titulo, pillClass, emoji, slots, ocupadosMap, carregando, adicionarAberto, onAdicionar, onEditarData, onEditarHorario, onRemover }) {
  return (
    <section className="vm-slots-section">
      <header className="vm-slots-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`vm-pill ${pillClass}`}>{emoji} {titulo}</span>
          {carregando
            ? <span className="vm-skeleton" style={{ height: 12, width: 44 }}/>
            : <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{slots.length} datas</span>
          }
        </div>
        <button
          className="vm-btn vm-btn-secondary"
          onClick={onAdicionar}
          style={{ padding: '8px 12px', fontSize: 12.5 }}
          disabled={adicionarAberto || carregando}
        >
          <IconPlus color="var(--ink)"/> Adicionar
        </button>
      </header>

      {carregando ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1].map((i) => (
            <div key={i} className="vm-slot-row" style={{ pointerEvents: 'none' }}>
              <span className="vm-skeleton" style={{ height: 38, flex: '1 1 160px' }}/>
              <span className="vm-skeleton" style={{ height: 38, flex: '0 0 90px' }}/>
              <span className="vm-skeleton" style={{ height: 14, flex: 1 }}/>
              <span className="vm-skeleton" style={{ height: 28, width: 28, borderRadius: 8 }}/>
            </div>
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="vm-card vm-card-soft vm-empty" style={{ padding: 18, fontSize: 12.5 }}>
          Nenhuma data cadastrada.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slots.map((slot) => {
            const ocupado = ocupadosMap[slot.iso];
            return (
              <div key={slot.id} className="vm-slot-row">
                <input type="date" value={slot.iso} onChange={(e) => onEditarData(slot, e.target.value)} aria-label="Data"/>
                <input type="time" value={slot.horario} onChange={(e) => onEditarHorario(slot, e.target.value)} step="900" aria-label="Horário"/>
                <span className={`vm-slot-meta${ocupado ? ' is-ocupado' : ''}`}>
                  {diaSemana(slot.iso).toLowerCase()}
                  {ocupado ? <> · ocupado por <b>{ocupado.nome}</b></> : <> · livre</>}
                </span>
                <button className="vm-icon-btn" title="Remover slot" onClick={() => onRemover(slot)}>
                  <IconTrash color="var(--ink-soft)"/>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
