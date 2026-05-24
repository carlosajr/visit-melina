// utils/datas.js — helpers de data e formatação

export const DATA_INICIAL = new Date(2026, 4, 25); // 25/05/2026 (mês 0-indexed)
export const SEMANAS_DISPONIVEIS = 8;

const _DIAS_SEMANA = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
];
const _MESES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];
const _MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function isoDia(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// TODO: integrar com API — horário virá do backend, podendo variar por dia
export function gerarDatasDisponiveis(tipo, base = DATA_INICIAL, semanas = SEMANAS_DISPONIVEIS) {
  const diaAlvo = tipo === 'amigo' ? 6 : 0; // sáb = 6, dom = 0
  const out = [];
  const cursor = new Date(base);
  while (cursor.getDay() !== diaAlvo) cursor.setDate(cursor.getDate() + 1);
  for (let i = 0; i < semanas; i++) {
    const d = new Date(cursor);
    out.push({ data: d, iso: isoDia(d), horario: '16:00' });
    cursor.setDate(cursor.getDate() + 7);
  }
  return out;
}

export function formatarHorario(h) {
  if (!h) return '';
  const [hh, mm] = String(h).split(':');
  const horas = parseInt(hh, 10);
  if (!mm || mm === '00') return `${horas}h`;
  return `${horas}h${mm}`;
}

export function formatarDataCurta(d) {
  const date = (d instanceof Date) ? d : new Date(d + 'T00:00:00');
  return `${date.getDate()} ${_MESES[date.getMonth()]}`;
}

export function formatarDataExtensa(d) {
  const date = (d instanceof Date) ? d : new Date(d + 'T00:00:00');
  return `${_DIAS_SEMANA[date.getDay()]}, ${date.getDate()} de ${_MESES_LONGOS[date.getMonth()]}`;
}

export function diaSemana(d) {
  const date = (d instanceof Date) ? d : new Date(d + 'T00:00:00');
  return _DIAS_SEMANA[date.getDay()];
}

export function nomeMesCurto(d) {
  const date = (d instanceof Date) ? d : new Date(d + 'T00:00:00');
  return _MESES[date.getMonth()];
}
