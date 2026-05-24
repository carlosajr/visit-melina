// components/Decoracao.jsx — ícones SVG + elementos decorativos

export const IconHex = ({ size = 18, fill = 'currentColor', stroke = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} aria-hidden="true">
    <path d="M12 2 L21.66 7.5 L21.66 16.5 L12 22 L2.34 16.5 L2.34 7.5 Z" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const IconHexOutline = ({ size = 18, color = 'currentColor', strokeWidth = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2 L21.66 7.5 L21.66 16.5 L12 22 L2.34 16.5 L2.34 7.5 Z"/>
  </svg>
);

export const IconDrop = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2 C 12 2 4 11 4 16 a8 8 0 0 0 16 0 c0-5-8-14-8-14 Z"/>
  </svg>
);

export const IconFlower = ({ size = 22, petal = 'var(--rose-deep)', center = 'var(--honey)' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    {[0, 72, 144, 216, 288].map((deg) => (
      <ellipse key={deg} cx="16" cy="9" rx="4.2" ry="6.4"
        transform={`rotate(${deg} 16 16)`} fill={petal} opacity="0.95" />
    ))}
    <circle cx="16" cy="16" r="3.4" fill={center} />
  </svg>
);

export const IconCheck = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8.5 L6.5 12 L13 4.5"/>
  </svg>
);

export const IconX = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M4 4 L12 12 M12 4 L4 12"/>
  </svg>
);

export const IconChev = ({ size = 14, color = 'currentColor', dir = 'right' }) => {
  const rot = { right: 0, left: 180, down: 90, up: -90 }[dir] || 0;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true">
      <path d="M6 3 L11 8 L6 13"/>
    </svg>
  );
};

export const IconArrowL = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3 L5 8 L10 13 M5 8 H14"/>
  </svg>
);

export const IconPlus = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M8 3 V13 M3 8 H13"/>
  </svg>
);

export const IconCalendar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.8"/>
    <path d="M2.5 6.5 H13.5 M5.5 2 V5 M10.5 2 V5"/>
  </svg>
);

export const IconUser = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="5.5" r="2.5"/>
    <path d="M3 14 c0-3 2-5 5-5 s5 2 5 5"/>
  </svg>
);

export const IconHeart = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
    <path d="M8 13.5 C 3 10 2 7 2 5.2 A2.7 2.7 0 0 1 4.7 2.5 a2.7 2.7 0 0 1 2.3 1.3 l1 1.4 l1-1.4 a2.7 2.7 0 0 1 2.3 -1.3 A2.7 2.7 0 0 1 14 5.2 c0 1.8 -1 4.8 -6 8.3 Z"/>
  </svg>
);

export const IconWpp = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 13.5 L3.4 10.5 a5.5 5.5 0 1 1 2.1 2.1 Z"/>
    <path d="M6 6.5 c0 0 .6 1.5 1.5 2.4 s2.4 1.5 2.4 1.5 l1-1 l1.5 .7 l-.4 1.5 c-2 .5 -4-1-4-1 s-2.5-2-3-4 l1.5-.4 l.7 1.5 z" fill={color}/>
  </svg>
);

export const IconEmail = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3.5" width="12" height="9" rx="1.5"/>
    <path d="M2.5 4.5 L8 8.5 L13.5 4.5"/>
  </svg>
);

export const IconLock = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7.5" width="10" height="6.5" rx="1.4"/>
    <path d="M5 7.5 V5.2 A3 3 0 0 1 11 5.2 V7.5"/>
  </svg>
);

export const IconTrash = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 4.5 H13 M5.5 4.5 V3 a1 1 0 0 1 1-1 h3 a1 1 0 0 1 1 1 v1.5 M4.5 4.5 L5 13 a1 1 0 0 0 1 .9 h4 a1 1 0 0 0 1 -.9 L11.5 4.5"/>
  </svg>
);

export const IconDownload = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 2 V10 M4.5 6.5 L8 10 L11.5 6.5 M3 13 H13"/>
  </svg>
);

export const LogoMelina = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient id="vmLogoG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F2C161"/>
        <stop offset="100%" stopColor="#C99537"/>
      </linearGradient>
    </defs>
    <path d="M24 4 L43.32 14.5 L43.32 33.5 L24 44 L4.68 33.5 L4.68 14.5 Z" fill="url(#vmLogoG)"/>
    <path d="M24 11 L37.5 18.5 L37.5 29.5 L24 37 L10.5 29.5 L10.5 18.5 Z" fill="#FFFBF0" opacity="0.9"/>
    <circle cx="24" cy="24" r="4.2" fill="#D88F92"/>
  </svg>
);

export const HoneycombBackdrop = ({ opacity = 0.25, color = 'var(--honey)' }) => (
  <svg className="vm-honeycomb-bg" width="220" height="220" viewBox="0 0 220 220" style={{ opacity }} aria-hidden="true">
    <defs>
      <pattern id="vmHoneyPat" width="36" height="42" patternUnits="userSpaceOnUse">
        <path d="M9 1 L27 1 L36 16 L27 31 L9 31 L0 16 Z" fill="none" stroke={color} strokeWidth="1.2"/>
        <path d="M27 31 L45 31 L54 46 L45 61 L27 61 L18 46 Z" fill="none" stroke={color} strokeWidth="1.2"/>
      </pattern>
    </defs>
    <rect width="220" height="220" fill="url(#vmHoneyPat)"/>
  </svg>
);

export const VMBrand = () => (
  <div className="vm-brand">
    <span className="vm-brand-mark"><LogoMelina size={38}/></span>
    <span className="vm-brand-text">
      <b>Visite a Melina</b>
      <span>nosso jardim de visitas</span>
    </span>
  </div>
);

const _Florzinha = ({ cx, cy, petal, center, small, leaf = false }) => {
  const r = small ? 3.2 : 4.4;
  const stemBottom = cy + (small ? 18 : 24);
  return (
    <g opacity="0.95">
      <path d={`M${cx},${stemBottom} Q${cx - 1.5},${(cy + stemBottom) / 2} ${cx},${cy + r}`}
            stroke="var(--sage-deep)" strokeWidth={small ? 1.2 : 1.5}
            fill="none" strokeLinecap="round" opacity="0.7"/>
      {leaf && (
        <path d={`M${cx},${stemBottom - 9} Q${cx + 6},${stemBottom - 11} ${cx + 8},${stemBottom - 6} Q${cx + 5},${stemBottom - 8} ${cx},${stemBottom - 9} Z`}
              fill="var(--sage-deep)" opacity="0.55"/>
      )}
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx={cx} cy={cy - r * 1.05} rx={r * 0.78} ry={r * 1.05}
                 fill={petal} opacity="0.92"
                 transform={`rotate(${deg} ${cx} ${cy})`}/>
      ))}
      <circle cx={cx} cy={cy} r={small ? 1.5 : 2.1} fill={center}/>
    </g>
  );
};

const _TufoGrama = ({ x, y, scale = 1, opacity = 0.55 }) => (
  <g stroke="var(--sage-deep)" strokeWidth={1.4 * scale} strokeLinecap="round"
     fill="none" opacity={opacity}>
    <path d={`M${x - 4 * scale},${y} Q${x - 2 * scale},${y - 8 * scale} ${x - 1 * scale},${y - 12 * scale}`}/>
    <path d={`M${x},${y} L${x},${y - 15 * scale}`}/>
    <path d={`M${x + 4 * scale},${y} Q${x + 2 * scale},${y - 7 * scale} ${x + 1 * scale},${y - 11 * scale}`}/>
  </g>
);

export const JardimRodape = () => (
  <svg className="vm-jardim" viewBox="0 0 800 90"
       preserveAspectRatio="xMidYEnd slice" aria-hidden="true">
    <path d="M0,55 Q90,32 180,40 T360,38 T540,42 T720,36 T800,38 L800,90 L0,90 Z"
          fill="var(--sage-soft)" opacity="0.85"/>
    <path d="M0,68 Q80,58 160,64 T320,62 T520,66 T720,62 T800,64 L800,90 L0,90 Z"
          fill="var(--sage)" opacity="0.55"/>

    <_TufoGrama x={45} y={67}/>
    <_TufoGrama x={210} y={68} scale={0.85} opacity={0.5}/>
    <_TufoGrama x={365} y={66}/>
    <_TufoGrama x={490} y={68} scale={0.9}/>
    <_TufoGrama x={635} y={66} opacity={0.5}/>
    <_TufoGrama x={760} y={68} scale={0.85}/>

    <_Florzinha cx={120} cy={50} petal="var(--rose-deep)" center="var(--honey)" leaf/>
    <_Florzinha cx={275} cy={48} petal="var(--rose)" center="var(--rose-deep)" small/>
    <_Florzinha cx={420} cy={52} petal="var(--honey)" center="var(--honey-deep)" leaf/>
    <_Florzinha cx={555} cy={46} petal="var(--rose-deep)" center="var(--honey)" small/>
    <_Florzinha cx={690} cy={50} petal="var(--rose)" center="var(--rose-deep)" leaf/>
  </svg>
);
