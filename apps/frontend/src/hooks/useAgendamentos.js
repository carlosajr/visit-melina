// hooks/useAgendamentos.js — integrado com API REST

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, apiAdmin, apiVisitor } from '../api/client';

export function useAgendamentos() {
  const [lista, setLista] = useState([]);         // admin only
  const [datasOcupadasArr, setDatasOcupadasArr] = useState([]); // público

  // Carrega datas ocupadas (público) para bloquear no calendário
  useEffect(() => {
    api('/agendamentos/datas-ocupadas')
      .then((arr) => setDatasOcupadasArr(arr ?? []))
      .catch(() => {});
  }, []);

  const datasOcupadas = useMemo(() => new Set(datasOcupadasArr), [datasOcupadasArr]);

  // Carrega lista completa (apenas quando há token admin)
  const carregarLista = useCallback(async () => {
    try {
      const dados = await apiAdmin('/agendamentos/admin');
      setLista(dados ?? []);
    } catch {
      setLista([]);
    }
  }, []);

  // Verifica duplicidade de whatsapp (chamada pública, retorna bool)
  const checkWhatsapp = useCallback(async (whatsapp) => {
    if (!whatsapp) return false;
    try {
      const res = await api(`/agendamentos/check-whatsapp?whatsapp=${encodeURIComponent(whatsapp)}`);
      return res?.existe ?? false;
    } catch {
      return false;
    }
  }, []);

  // Cria agendamento (público)
  const criar = useCallback(async (dados) => {
    const ag = await api('/agendamentos', {
      method: 'POST',
      body: JSON.stringify({
        data: dados.data,
        horario: dados.horario || '16:00',
        nome: dados.nome,
        whatsapp: dados.whatsapp,
        email: dados.email || undefined,
        acompanhantes: (dados.acompanhantes || []).filter((n) => n.trim()),
      }),
    });
    // Atualiza datas ocupadas localmente para resposta imediata
    setDatasOcupadasArr((arr) => [...arr, ag.data]);
    return ag;
  }, []);

  // Atualiza data (visitor JWT)
  const atualizar = useCallback(async (id, patch) => {
    return apiVisitor(`/agendamentos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ data: patch.data, horario: patch.horario }),
    });
  }, []);

  // Cancela agendamento (visitor JWT) — recebe a data do agendamento para liberar no mapa
  const cancelar = useCallback(async (id, data) => {
    await apiVisitor(`/agendamentos/${id}`, { method: 'DELETE' });
    if (data) setDatasOcupadasArr((arr) => arr.filter((d) => d !== data));
  }, []);

  // Admin: cancela qualquer agendamento
  const cancelarAdmin = useCallback(async (id) => {
    const ag = lista.find((a) => a.id === id);
    await apiAdmin(`/agendamentos/admin/${id}`, { method: 'DELETE' });
    setLista((l) => l.filter((a) => a.id !== id));
    if (ag?.data) setDatasOcupadasArr((arr) => arr.filter((d) => d !== ag.data));
  }, [lista]);

  return {
    lista,
    datasOcupadas,
    carregarLista,
    checkWhatsapp,
    criar,
    atualizar,
    cancelar,
    cancelarAdmin,
  };
}
