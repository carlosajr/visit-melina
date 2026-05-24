// utils/mascaras.js — máscaras de input e validações de formato

export function mascararWhatsApp(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

export function validarWhatsApp(valor) {
  const d = apenasDigitos(valor);
  if (d.length !== 11) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  if (d[2] !== '9') return false;
  return true;
}

export function validarEmail(valor) {
  const v = String(valor || '').trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function isGmail(valor) {
  return /@gmail\.com$/i.test(String(valor || '').trim());
}
