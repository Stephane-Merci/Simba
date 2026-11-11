import type { Operation } from '../../types';

const TEINTES: Record<Operation | 'neutre', { cote: string; dessus: string; arriere: string }> = {
    DECHARGEMENT: { cote: '#0ea5e9', dessus: '#7dd3fc', arriere: '#0284c7' },
    CHARGEMENT: { cote: '#f59e0b', dessus: '#fcd34d', arriere: '#d97706' },
    neutre: { cote: '#94a3b8', dessus: '#cbd5e1', arriere: '#64748b' },
};

interface Props {
    operation?: Operation;
    largeur?: number;
    roule?: boolean;
    className?: string;
}

/**
 * Camion en perspective (2,5D) : la couleur de la remorque indique l'opération
 * (bleu = déchargement, ambre = chargement).
 */
export default function Camion3D({ operation, largeur = 72, roule = false, className = '' }: Props) {
    const t = TEINTES[operation ?? 'neutre'];
    const roue = (cx: number) => (
        <g key={cx}>
            <circle cx={cx} cy={49} r={6.5} fill="#0f172a" />
            <g className={roule ? 'roue-tourne' : ''}>
                <circle cx={cx} cy={49} r={3} fill="#cbd5e1" />
                <rect x={cx - 0.6} y={46} width={1.2} height={6} fill="#475569" />
            </g>
        </g>
    );
    return (
        <svg
            viewBox="0 0 124 60"
            width={largeur}
            height={(largeur * 60) / 124}
            className={`overflow-visible ${className}`}
            aria-hidden
        >
            <ellipse cx={62} cy={55} rx={58} ry={4} fill="rgba(15,23,42,0.18)" />
            <g className="camion-moteur">
                {/* Remorque */}
                <polygon points="4,14 13,6 87,6 78,14" fill={t.dessus} />
                <rect x={4} y={14} width={74} height={32} rx={2} fill={t.cote} />
                <rect x={4} y={14} width={74} height={32} rx={2} fill="url(#reflet)" />
                {[22, 40, 58].map((x) => (
                    <line key={x} x1={x} y1={16} x2={x} y2={44} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
                ))}
                <polygon points="78,14 87,6 87,38 78,46" fill={t.arriere} />
                {/* Châssis */}
                <rect x={4} y={45} width={106} height={3} fill="#334155" />
                {/* Cabine */}
                <polygon points="89,22 96,15 111,15 104,22" fill="#475569" />
                <path d="M89 22 H104 L110 30 V46 H89 Z" fill="#1e293b" />
                <polygon points="104,22 111,15 117,23 110,30" fill="#334155" />
                <polygon points="110,30 117,23 117,39 110,46" fill="#0f172a" />
                <path d="M93 25 H103 L107 31 H93 Z" fill="#bae6fd" opacity={0.9} />
                <rect x={110} y={38} width={4} height={2} rx={1} fill="#fde68a" />
                {roue(20)}
                {roue(34)}
                {roue(100)}
            </g>
            <defs>
                <linearGradient id="reflet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
                    <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
            </defs>
        </svg>
    );
}
