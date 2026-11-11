import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useUi } from '../../store/useUi';
import Modale from './Modale';
import Bouton from './Bouton';

const ICONES = {
    succes: <CheckCircle2 className="text-emerald-500" size={20} />,
    erreur: <AlertTriangle className="text-rose-500" size={20} />,
    info: <Info className="text-sky-500" size={20} />,
};

/** Notifications (toasts) + boîte de confirmation globales. */
export default function Notifications() {
    const toasts = useUi((s) => s.toasts);
    const retirer = useUi((s) => s.retirerToast);
    const confirmation = useUi((s) => s.confirmation);
    const repondre = useUi((s) => s.repondre);

    return (
        <>
            {createPortal(
                <div className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 sm:bottom-6">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className="glass-strong animate-toast pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3"
                            role="status"
                        >
                            <div className="mt-0.5 shrink-0">{ICONES[t.type]}</div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900">{t.titre}</p>
                                {t.message && <p className="mt-0.5 text-sm text-slate-600">{t.message}</p>}
                            </div>
                            <button onClick={() => retirer(t.id)} className="text-slate-400 hover:text-slate-700" aria-label="Fermer">
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>,
                document.body,
            )}

            <Modale
                ouvert={!!confirmation}
                onFermer={() => repondre(false)}
                titre={confirmation?.titre}
                largeur="max-w-md"
                pied={
                    <>
                        <Bouton variante="fantome" onClick={() => repondre(false)}>
                            Annuler
                        </Bouton>
                        <Bouton
                            variante={confirmation?.danger ? 'danger' : 'primaire'}
                            onClick={() => repondre(true)}
                            autoFocus
                        >
                            {confirmation?.libelleOk ?? 'Confirmer'}
                        </Bouton>
                    </>
                }
            >
                <p className="text-sm leading-relaxed text-slate-600">{confirmation?.message}</p>
            </Modale>
        </>
    );
}
