// hooks/useValidacaoWhatsApp.js — validação reativa de WhatsApp
//
// TODO: integrar com API de validação de número WhatsApp real.

import { useMemo } from 'react';

export function useValidacaoWhatsApp(valor) {
  return useMemo(() => {
    const digits = String(valor || '').replace(/\D/g, '');
    if (digits.length === 0) {
      return { estado: 'vazio', valido: false, mensagem: '' };
    }
    if (digits.length < 11) {
      return { estado: 'incompleto', valido: false, mensagem: 'Digite o DDD e os 9 dígitos do celular' };
    }
    const ddd = parseInt(digits.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) {
      return { estado: 'invalido', valido: false, mensagem: 'DDD inválido' };
    }
    if (digits[2] !== '9') {
      return { estado: 'invalido', valido: false, mensagem: 'O número precisa começar com 9' };
    }
    return { estado: 'valido', valido: true, mensagem: '' };
  }, [valor]);
}
