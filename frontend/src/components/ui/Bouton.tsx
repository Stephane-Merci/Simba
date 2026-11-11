import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primaire' | 'secondaire' | 'danger' | 'fantome' | 'succes';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: Variante;
    chargement?: boolean;
    icone?: ReactNode;
    taille?: 'md' | 'lg' | 'sm';
}

const VARIANTES: Record<Variante, string> = {
    primaire:
        'bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-lg shadow-slate-900/25 hover:from-slate-700 hover:to-slate-900',
    secondaire: 'bg-white/70 text-slate-800 border border-slate-200/80 hover:bg-white shadow-sm',
    danger: 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 hover:from-rose-400 hover:to-rose-500',
    succes: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-emerald-500',
    fantome: 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900',
};

const TAILLES = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-5 py-3.5 text-base rounded-2xl',
};

export default function Bouton({
    variante = 'primaire',
    taille = 'md',
    chargement,
    icone,
    children,
    className = '',
    disabled,
    type = 'button',
    ...props
}: Props) {
    return (
        <button
            type={type}
            disabled={disabled || chargement}
            className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTES[variante]} ${TAILLES[taille]} ${className}`}
            {...props}
        >
            {chargement ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
                icone
            )}
            {children}
        </button>
    );
}
