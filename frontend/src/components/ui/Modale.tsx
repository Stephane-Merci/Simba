import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
    ouvert: boolean;
    onFermer: () => void;
    titre?: ReactNode;
    sousTitre?: ReactNode;
    children: ReactNode;
    pied?: ReactNode;
    largeur?: string;
}

/** Fenêtre modale en verre, fermeture par Échap ou clic à l'extérieur. */
export default function Modale({ ouvert, onFermer, titre, sousTitre, children, pied, largeur = 'max-w-lg' }: Props) {
    useEffect(() => {
        if (!ouvert) return;
        const surTouche = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
        window.addEventListener('keydown', surTouche);
        return () => window.removeEventListener('keydown', surTouche);
    }, [ouvert, onFermer]);

    if (!ouvert) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/30 p-0 backdrop-blur-sm animate-fondu sm:items-center sm:p-4"
            style={{ perspective: 1200 }}
            onMouseDown={(e) => e.target === e.currentTarget && onFermer()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`glass-strong animate-modal flex max-h-[92vh] w-full ${largeur} flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl`}
            >
                {titre && (
                    <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{titre}</h2>
                            {sousTitre && <p className="mt-0.5 text-sm text-slate-500">{sousTitre}</p>}
                        </div>
                        <button
                            onClick={onFermer}
                            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700"
                            aria-label="Fermer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="scroll-fin flex-1 overflow-y-auto px-6 py-4">{children}</div>
                {pied && <div className="flex justify-end gap-2 border-t border-white/60 bg-white/40 px-6 py-4">{pied}</div>}
            </div>
        </div>,
        document.body,
    );
}
