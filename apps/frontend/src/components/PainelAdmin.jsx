// components/PainelAdmin.jsx — painel administrativo com auth JWT real

import { useState, useEffect } from 'react';
import {
  VMBrand, IconArrowL, IconCalendar, IconHexOutline,
  IconLock, IconTrash, IconDownload,
} from './Decoracao';
import { GerenciarSlots } from './GerenciarSlots';
import { useAgendamentos } from '../hooks/useAgendamentos';
import { formatarDataCurta, formatarHorario, diaSemana } from '../utils/datas';
import { api, apiAdmin, setAdminToken, clearAdminToken, hasAdminToken } from '../api/client';

export function PainelAdmin({ onVoltarHome }) {
  const { lista, carregarLista, cancelarAdmin } = useAgendamentos();
  const [autenticado, setAutenticado] = useState(hasAdminToken);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [tab, setTab] = useState('agendamentos');
  const [googleStatus, setGoogleStatus] = useState(null); // { conectado, email }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_auth') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab('agendamentos');
    }
  }, []);

  useEffect(() => {
    if (autenticado) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCarregandoLista(true);
      carregarLista().finally(() => setCarregandoLista(false));
      apiAdmin('/google/status')
        .then((s) => setGoogleStatus(s))
        .catch(() => {});
    }
  }, [autenticado, carregarLista]);

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setCarregando(true);
    setErro('');
    try {
      const res = await api('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ senha }),
      });
      setAdminToken(res.accessToken);
      setAutenticado(true);
    } catch {
      setErro('Senha incorreta. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleSair = () => {
    clearAdminToken();
    setAutenticado(false);
    setSenha('');
    onVoltarHome();
  };

  const handleConectarGoogle = async () => {
    try {
      const res = await apiAdmin('/google/auth-url');
      window.location.href = res.url;
    } catch {
      setErro('Não foi possível iniciar autenticação com Google.');
    }
  };

  const exportarCSV = () => {
    const cabecalho = ['Data', 'Horário', 'Nome', 'WhatsApp', 'E-mail', 'Acompanhantes', 'Convite GCal', 'Criado em'];
    const linhas = lista.map((a) => [
      a.data, a.horario || '16:00', a.nome, a.whatsapp,
      a.email || '', (a.acompanhantes || []).join(' | '),
      a.inviteSent ? 'sim' : 'nao', a.criadoEm,
    ]);
    const csv = [cabecalho, ...linhas]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agendamentos-melina-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (!autenticado) {
    return (
      <div className="vm-screen">
        <button type="button" className="vm-back" onClick={onVoltarHome}>
          <IconArrowL color="var(--ink-soft)"/> Voltar
        </button>
        <VMBrand />
        <div>
          <div className="vm-eyebrow">Área restrita</div>
          <h2 className="vm-h2" style={{ marginTop: 6 }}>Painel administrativo</h2>
          <p className="vm-lede" style={{ marginTop: 6 }}>Digite a senha para acessar os agendamentos.</p>
        </div>
        <form className="vm-card" onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="vm-label" htmlFor="vm-pw">Senha <IconLock color="var(--muted)"/></label>
            <input
              id="vm-pw"
              type="password"
              className="vm-input"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(''); }}
              autoFocus
            />
          </div>
          {erro && <p className="vm-error">{erro}</p>}
          <button type="submit" className="vm-btn vm-btn-primary" disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  const totalGmail = lista.filter((a) => a.inviteSent).length;

  return (
    <div className="vm-admin">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="vm-eyebrow">Painel administrativo</div>
          <h2 className="vm-h2" style={{ marginTop: 4 }}>Agendamentos da Melina</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Status Google Calendar */}
          {googleStatus && (
            <span style={{ fontSize: 12, color: googleStatus.conectado ? 'var(--sage-deep)' : 'var(--muted)', fontWeight: 700 }}>
              {googleStatus.conectado ? `📅 ${googleStatus.email}` : ''}
            </span>
          )}
          {googleStatus && (
            <button
              className="vm-btn vm-btn-secondary"
              onClick={handleConectarGoogle}
              style={{ padding: '8px 12px', fontSize: 12.5 }}
              title={googleStatus.conectado
                ? 'Reconectar o Google Calendar (gera um novo acesso — use se os eventos pararam de ser criados)'
                : 'Conectar Google Calendar para criar eventos automaticamente'}
            >
              <IconCalendar size={13} color="var(--ink)"/> {googleStatus.conectado ? 'Reconectar Google' : 'Conectar Google'}
            </button>
          )}
          {tab === 'agendamentos' && (
            <button className="vm-btn vm-btn-honey" onClick={exportarCSV} style={{ padding: '10px 14px', fontSize: 13 }}>
              <IconDownload color="var(--ink)"/> Exportar CSV
            </button>
          )}
          <button className="vm-btn vm-btn-secondary" onClick={handleSair} style={{ padding: '10px 14px', fontSize: 13 }}>Sair</button>
        </div>
      </div>

      <div className="vm-admin-tabs">
        <button
          className={`vm-admin-tab${tab === 'agendamentos' ? ' is-active' : ''}`}
          onClick={() => setTab('agendamentos')}
        >
          Agendamentos <span className="vm-tab-count">{lista.length}</span>
        </button>
        <button
          className={`vm-admin-tab${tab === 'slots' ? ' is-active' : ''}`}
          onClick={() => setTab('slots')}
        >
          <IconCalendar size={14} color="currentColor"/> Datas disponíveis
        </button>
      </div>

      {tab === 'slots' ? (
        <GerenciarSlots listaAgendamentos={lista} />
      ) : carregandoLista ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="vm-admin-card" style={{ padding: 12 }}>
                <span className="vm-skeleton" style={{ height: 10, width: '60%', marginBottom: 10 }}/>
                <span className="vm-skeleton" style={{ height: 32, width: '45%' }}/>
              </div>
            ))}
          </div>
          <div className="vm-admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: i < 3 ? '1px solid var(--hairline)' : 'none', alignItems: 'center' }}>
                <span className="vm-skeleton" style={{ height: 22, width: 52, borderRadius: 20, flexShrink: 0 }}/>
                <span className="vm-skeleton" style={{ height: 16, width: 90, flexShrink: 0 }}/>
                <span className="vm-skeleton" style={{ height: 16, flex: '0 0 130px' }}/>
                <span className="vm-skeleton" style={{ height: 16, flex: '0 0 110px' }}/>
                <span className="vm-skeleton" style={{ height: 16, flex: 1 }}/>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 18 }}>
            <StatCard label="Total de visitas" valor={lista.length} cor="var(--ink)"/>
          </div>

          <div className="vm-admin-card">
            {lista.length === 0 ? (
              <div className="vm-empty">
                <IconHexOutline size={32} color="var(--muted)"/>
                <div>Nenhum agendamento ainda.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="vm-table">
                  <thead>
                    <tr>
                      <th>Data</th><th>Nome</th><th>WhatsApp</th>
                      <th>E-mail</th><th>Acomp.</th><th>GCal</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...lista].sort((a, b) => a.data.localeCompare(b.data)).map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 700 }}>
                          {formatarDataCurta(a.data)}
                          <span style={{ color: 'var(--honey-deep)', fontWeight: 800 }}> · {formatarHorario(a.horario || '16:00')}</span>
                          <div style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 10.5 }}>{diaSemana(a.data).toLowerCase()}</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{a.nome}</td>
                        <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-soft)' }}>{a.whatsapp}</td>
                        <td style={{ color: 'var(--ink-soft)' }}>{a.email || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                        <td style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>{(a.acompanhantes || []).length}</td>
                        <td style={{ textAlign: 'center' }}>
                          {a.inviteSent
                            ? <span title="Convite Google Calendar enviado"><IconCalendar size={14} color="var(--sage-deep)"/></span>
                            : <span style={{ color: 'var(--muted)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="vm-icon-btn"
                            title="Cancelar agendamento"
                            onClick={() => { if (confirm(`Cancelar agendamento de ${a.nome}?`)) cancelarAdmin(a.id); }}
                          >
                            <IconTrash color="var(--ink-soft)"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--muted)' }}>
        <span>{lista.length} agendamento(s) · {totalGmail} com Google Calendar</span>
      </div>
    </div>
  );
}

function StatCard({ label, valor, cor }) {
  return (
    <div className="vm-admin-card" style={{ padding: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: cor, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{valor}</div>
    </div>
  );
}
