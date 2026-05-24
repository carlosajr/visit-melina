// hooks/useSlots.js — integrado com API REST

import { useState, useEffect, useCallback } from 'react';
import { api, apiAdmin } from '../api/client';

export function tipoDoDia(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  if (d.getDay() === 6) return 'amigo';
  if (d.getDay() === 0) return 'familia';
  return null;
}

// Mapeia resposta da API {id, data, horario} → {id, iso, horario}
function mapSlot(s) {
  return { id: s.id, iso: s.data, horario: s.horario };
}

export function useSlots() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await api('/slots');
      setLista((dados ?? []).map(mapSlot));
    } catch (e) {
      console.warn('Falha ao carregar slots', e);
    } finally {
      setCarregando(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { carregar(); }, [carregar]);

  const slotsParaTipo = useCallback((tipo) => {
    return lista
      .filter((s) => tipoDoDia(s.iso) === tipo)
      .sort((a, b) => a.iso.localeCompare(b.iso));
  }, [lista]);

  const criar = useCallback(async (iso, horario) => {
    if (!tipoDoDia(iso)) throw new Error('A data deve ser um sábado ou domingo');
    if (!/^\d{2}:\d{2}$/.test(horario)) throw new Error('Horário em formato inválido');
    const novo = await apiAdmin('/slots', {
      method: 'POST',
      body: JSON.stringify({ data: iso, horario }),
    });
    setLista((l) => [...l, mapSlot(novo)].sort((a, b) => a.iso.localeCompare(b.iso)));
  }, []);

  const atualizar = useCallback(async (id, patch) => {
    // patch pode ter { iso: novaData } ou { horario: novoHorario }
    const body = {};
    if (patch.iso) body.data = patch.iso;
    if (patch.horario) body.horario = patch.horario;
    const atualizado = await apiAdmin(`/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setLista((l) => l.map((s) => s.id === id ? mapSlot(atualizado) : s).sort((a, b) => a.iso.localeCompare(b.iso)));
  }, []);

  const remover = useCallback(async (id) => {
    await apiAdmin(`/slots/${id}`, { method: 'DELETE' });
    setLista((l) => l.filter((s) => s.id !== id));
  }, []);

  return { lista, carregando, slotsParaTipo, criar, atualizar, remover };
}
