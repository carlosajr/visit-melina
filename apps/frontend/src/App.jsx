// App.jsx — orquestrador dos fluxos de "Visite a Melina"

import { useState, useMemo } from 'react';
import { JardimRodape, VMBrand, IconFlower, IconCalendar, IconUser, IconHex, IconChev } from './components/Decoracao';
import { StepTipoVisita } from './components/StepTipoVisita';
import { StepEscolhaData } from './components/StepEscolhaData';
import { StepDadosPessoais } from './components/StepDadosPessoais';
import { StepAcompanhantes } from './components/StepAcompanhantes';
import { StepConfirmacao } from './components/StepConfirmacao';
import { StepSucesso } from './components/StepSucesso';
import { MeuAgendamento } from './components/MeuAgendamento';
import { PainelAdmin } from './components/PainelAdmin';
import { useAgendamentos } from './hooks/useAgendamentos';

const RASCUNHO_VAZIO = {
  tipo: '',
  data: '',
  horario: '',
  nome: '',
  whatsapp: '',
  email: '',
  acompanhantes: [],
  editandoId: null,
  dataOriginal: null,
};

function App() {
  const ag = useAgendamentos();
  const [flow, setFlow] = useState('home');
  const [novoStep, setNovoStep] = useState('tipo');
  const [draft, setDraft] = useState(RASCUNHO_VAZIO);
  const [meuBusca, setMeuBusca] = useState('');
  const [meuAg, setMeuAg] = useState(null);
  const [meuPularOTP, setMeuPularOTP] = useState(false);
  const [sucessoAg, setSucessoAg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');

  const irParaHome = () => {
    setFlow('home');
    setNovoStep('tipo');
    setDraft(RASCUNHO_VAZIO);
    setMeuBusca('');
    setMeuAg(null);
    setMeuPularOTP(false);
    setSucessoAg(null);
    setErroSalvar('');
  };

  const novoAgendamento = () => {
    setFlow('novo');
    setNovoStep('tipo');
    setDraft(RASCUNHO_VAZIO);
  };

  const goStep = (s) => setNovoStep(s);

  const ignorarOcupacaoData = useMemo(() => {
    const s = new Set();
    if (draft.editandoId && draft.dataOriginal) s.add(draft.dataOriginal);
    return s;
  }, [draft.editandoId, draft.dataOriginal]);

  const handleSelectTipo = (tipo) => {
    setDraft((d) => ({ ...d, tipo }));
    setNovoStep('data');
  };

  const handleSelectData = async (dataISO, horario = '16:00') => {
    setDraft((d) => ({ ...d, data: dataISO, horario }));
    if (draft.editandoId) {
      setErroSalvar('');
      setSalvando(true);
      try {
        const atualizado = await ag.atualizar(draft.editandoId, { data: dataISO, horario });
        setMeuAg(atualizado);
        setDraft(RASCUNHO_VAZIO);
        setFlow('meu');
      } catch (e) {
        setErroSalvar(e.message || 'Erro ao atualizar');
      } finally {
        setSalvando(false);
      }
    } else {
      setNovoStep('dados');
    }
  };

  const handleConfirmar = async () => {
    setSalvando(true);
    setErroSalvar('');
    try {
      const novo = await ag.criar({
        tipo: draft.tipo,
        data: draft.data,
        horario: draft.horario || '16:00',
        nome: draft.nome.trim(),
        whatsapp: draft.whatsapp,
        email: draft.email.trim(),
        acompanhantes: draft.acompanhantes,
      });
      // Gera um visitor token automático para "Ver meu agendamento" logo após criar
      // (o backend retorna o agendamento sem JWT — usamos pularOTP=true)
      setSucessoAg(novo);
      setFlow('sucesso');
      setDraft(RASCUNHO_VAZIO);
    } catch (e) {
      setErroSalvar(e.message || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleIrParaMeuAgendamento = (whatsapp, pularOTP = false) => {
    setMeuBusca(whatsapp || '');
    setMeuAg(null);
    setMeuPularOTP(!!pularOTP);
    setFlow('meu');
  };

  const handleAlterarData = (agendamento) => {
    setDraft({
      ...RASCUNHO_VAZIO,
      tipo: agendamento.tipo,
      data: agendamento.data,
      horario: agendamento.horario || '16:00',
      nome: agendamento.nome,
      whatsapp: agendamento.whatsapp,
      email: agendamento.email || '',
      acompanhantes: agendamento.acompanhantes || [],
      editandoId: agendamento.id,
      dataOriginal: agendamento.data,
    });
    setNovoStep('data');
    setFlow('novo');
  };

  const showJardim = flow !== 'admin';

  if (flow === 'home') {
    return (
      <div className="vm-app">
        <Home onNovo={novoAgendamento} onMeu={() => setFlow('meu')} onAdmin={() => setFlow('admin')}/>
        {showJardim && <JardimRodape/>}
      </div>
    );
  }

  if (flow === 'sucesso' && sucessoAg) {
    return (
      <div className="vm-app">
        <StepSucesso agendamento={sucessoAg} onVoltarHome={irParaHome} onVerAgendamento={() => handleIrParaMeuAgendamento(sucessoAg.whatsapp, true)}/>
        {showJardim && <JardimRodape/>}
      </div>
    );
  }

  if (flow === 'meu') {
    return (
      <div className="vm-app">
        <MeuAgendamento
          onVoltarHome={irParaHome}
          onIrParaAlterarData={handleAlterarData}
          agendamentoPreCarregado={meuAg}
          busca={meuBusca}
          pularOTP={meuPularOTP}
        />
        {showJardim && <JardimRodape/>}
      </div>
    );
  }

  if (flow === 'admin') {
    return (
      <div className="vm-app">
        <PainelAdmin onVoltarHome={irParaHome}/>
      </div>
    );
  }

  // flow === 'novo'
  const renderNovoStep = () => {
    if (novoStep === 'tipo') {
      return <StepTipoVisita valor={draft.tipo} onSelect={handleSelectTipo} onBack={irParaHome}/>;
    }
    if (novoStep === 'data') {
      return (
        <StepEscolhaData
          tipo={draft.tipo}
          valor={draft.data}
          onSelect={handleSelectData}
          onBack={() => draft.editandoId ? setFlow('meu') : goStep('tipo')}
          datasOcupadas={ag.datasOcupadas}
          ignorarOcupacaoData={ignorarOcupacaoData}
          salvando={salvando}
          erro={erroSalvar}
        />
      );
    }
    if (novoStep === 'dados') {
      return (
        <StepDadosPessoais
          valor={draft}
          onChange={setDraft}
          onContinue={() => goStep('acompanhantes')}
          onBack={() => goStep('data')}
          checkWhatsapp={ag.checkWhatsapp}
          onIrParaMeuAgendamento={handleIrParaMeuAgendamento}
        />
      );
    }
    if (novoStep === 'acompanhantes') {
      return (
        <StepAcompanhantes
          valor={draft}
          onChange={setDraft}
          onContinue={() => goStep('confirmacao')}
          onBack={() => goStep('dados')}
        />
      );
    }
    if (novoStep === 'confirmacao') {
      return (
        <StepConfirmacao
          valor={draft}
          onConfirmar={handleConfirmar}
          onBack={() => goStep('acompanhantes')}
          onEditar={(secao) => {
            if (secao === 'tipo') goStep('tipo');
            else if (secao === 'data') goStep('data');
            else if (secao === 'dados') goStep('dados');
            else if (secao === 'acompanhantes') goStep('acompanhantes');
          }}
          salvando={salvando}
          erro={erroSalvar}
        />
      );
    }
    return null;
  };

  return (
    <div className="vm-app">
      {renderNovoStep()}
      {showJardim && <JardimRodape/>}
    </div>
  );
}

function Home({ onNovo, onMeu, onAdmin }) {
  return (
    <div className="vm-screen">
      <VMBrand />
      <div style={{ position: 'relative', marginTop: 4 }}>
        <div style={{ position: 'absolute', right: -6, top: -6, opacity: 0.7 }}>
          <IconFlower size={36} petal="var(--rose-deep)" center="var(--honey)"/>
        </div>
        <div className="vm-eyebrow" style={{ color: 'var(--rose-deep)' }}>Bem-vindos</div>
        <h1 className="vm-h1" style={{ marginTop: 6, maxWidth: 280 }}>
          Venha conhecer a <span style={{ color: 'var(--honey-deep)' }}>Melina</span> 🌸
        </h1>
        <p className="vm-lede" style={{ marginTop: 10, maxWidth: 300 }}>
          Nosso jardim está aberto para receber visitas com calma e carinho. Marque um dia bonito para vir.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
        <button
          type="button"
          className="vm-choice"
          onClick={onNovo}
          style={{ borderColor: 'var(--rose-deep)', background: 'var(--rose-soft)' }}
        >
          <span className="vm-choice-icon is-rose"><IconCalendar size={22} color="var(--rose-deep)"/></span>
          <span className="vm-choice-body">
            <span className="vm-choice-title">Quero agendar uma visita</span>
            <span className="vm-choice-sub">Amigos no sábado · família no domingo</span>
          </span>
          <span className="vm-choice-chev"><IconChev color="var(--rose-deep)"/></span>
        </button>

        <button type="button" className="vm-choice" onClick={onMeu}>
          <span className="vm-choice-icon is-honey"><IconUser size={22} color="var(--honey-deep)"/></span>
          <span className="vm-choice-body">
            <span className="vm-choice-title">Já tenho agendamento</span>
            <span className="vm-choice-sub">Ver, alterar ou cancelar</span>
          </span>
          <span className="vm-choice-chev"><IconChev color="var(--muted)"/></span>
        </button>
      </div>

      <div className="vm-card vm-card-soft" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 4 }}>
        <div style={{ flex: '0 0 auto', width: 36, height: 36, borderRadius: 12, background: 'var(--honey-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconHex size={18} fill="var(--honey-deep)"/>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          <b style={{ color: 'var(--ink)' }}>Uma visita por dia</b><br/>
          Para o sossego da Melina, recebemos apenas apenas uma visita por dia, assim a Melina recebe cada visita com calma e carinho.
        </div>
      </div>

      <div className="vm-footer-admin">
        <button onClick={onAdmin}>Administrar</button>
      </div>
    </div>
  );
}

export default App;
