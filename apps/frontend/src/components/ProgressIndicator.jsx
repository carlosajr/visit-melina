// components/ProgressIndicator.jsx — barra de progresso por segmentos

export function ProgressIndicator({ step, total = 5, labels }) {
  const labelAtual = labels && labels[step - 1];
  return (
    <div>
      <div className="vm-progress-label" style={{ marginBottom: 6 }}>
        Passo {step} de {total} {labelAtual ? `· ${labelAtual}` : ''}
      </div>
      <div className="vm-progress">
        {Array.from({ length: total }).map((_, i) => {
          const n = i + 1;
          const cls =
            n < step ? 'vm-progress-dot is-done' :
            n === step ? 'vm-progress-dot is-active' :
            'vm-progress-dot';
          return <div key={i} className={cls} />;
        })}
      </div>
    </div>
  );
}
