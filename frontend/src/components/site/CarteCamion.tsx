import { Draggable, type DraggableProvided, type DraggableStateSnapshot, type DraggableRubric } from '@hello-pangea/dnd';
import { AlertTriangle, Timer } from 'lucide-react';
import { niveauSejour, sejourActuel, type Niveau } from '../../lib/parcours';
import { duree } from '../../lib/format';
import { useMaintenant } from '../../hooks/useMaintenant';
import { useSite } from '../../store/useSite';
import { useUi } from '../../store/useUi';
import type { Visite } from '../../types';
import Camion3D from '../ui/Camion3D';
import Plaque from '../ui/Plaque';
import BadgeOperation from '../ui/BadgeOperation';

export type VarianteCarte = 'liste' | 'quai' | 'parking';

const ANNEAUX: Record<Niveau, string> = {
    ok: 'ring-1 ring-white/80',
    attention: 'ring-2 ring-amber-400',
    alerte: 'ring-2 ring-rose-500 anneau-alerte',
};

function Chrono({ visite, maintenant, niveau }: { visite: Visite; maintenant: number; niveau: Niveau }) {
    const s = sejourActuel(visite);
    const ms = s ? maintenant - new Date(s.debut).getTime() : 0;
    const couleur = niveau === 'alerte' ? 'text-rose-600' : niveau === 'attention' ? 'text-amber-600' : 'text-slate-500';
    return (
        <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold ${couleur}`} title="Temps dans cette zone">
            {niveau === 'ok' ? <Timer size={11} /> : <AlertTriangle size={11} />}
            {duree(ms)}
        </span>
    );
}

/** Carte visuelle d'un camion présent sur le site. */
export function CarteCamion({
    visite,
    variante,
    rang,
    enDeplacement,
}: {
    visite: Visite;
    variante: VarianteCarte;
    rang?: number;
    enDeplacement?: boolean;
}) {
    const maintenant = useMaintenant();
    const niveau = niveauSejour(sejourActuel(visite), maintenant);
    const base = `glass relative select-none rounded-2xl transition-shadow ${ANNEAUX[niveau]} ${
        enDeplacement ? 'rotate-[-2deg] scale-105 shadow-2xl shadow-slate-900/30' : 'hover:shadow-xl'
    }`;

    if (variante === 'quai') {
        return (
            <div className={`${base} flex flex-col items-center gap-1 px-1.5 pb-2 pt-1.5`}>
                <Camion3D operation={visite.operation} largeur={74} roule={enDeplacement} />
                <Plaque matricule={visite.camion.matricule} taille="sm" />
                <Chrono visite={visite} maintenant={maintenant} niveau={niveau} />
            </div>
        );
    }

    if (variante === 'parking') {
        return (
            <div className={`${base} flex items-center gap-2 px-2 py-1.5`}>
                <Camion3D operation={visite.operation} largeur={38} roule={enDeplacement} />
                <div className="min-w-0 flex-1">
                    <Plaque matricule={visite.camion.matricule} taille="sm" />
                    <div className="mt-0.5">
                        <Chrono visite={visite} maintenant={maintenant} niveau={niveau} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${base} flex items-center gap-3 px-3 py-2.5`}>
            {rang !== undefined && (
                <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-[11px] font-black text-white shadow-md">
                    {rang}
                </span>
            )}
            <Camion3D operation={visite.operation} largeur={58} roule={enDeplacement} />
            <div className="min-w-0 flex-1 space-y-1">
                <Plaque matricule={visite.camion.matricule} />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <BadgeOperation operation={visite.operation} />
                    <Chrono visite={visite} maintenant={maintenant} niveau={niveau} />
                </div>
                {visite.camion.transporteur && (
                    <p className="truncate text-[11px] font-medium text-slate-500">{visite.camion.transporteur}</p>
                )}
            </div>
        </div>
    );
}

/** Carte déplaçable par glisser-déposer ; un clic ouvre la fiche du camion. */
export function CamionGlissable({ visite, index, variante, rang }: { visite: Visite; index: number; variante: VarianteCarte; rang?: number }) {
    const ouvrir = useUi((s) => s.ouvrirVisite);
    return (
        <Draggable draggableId={visite.id} index={index}>
            {(p, s) => (
                <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    onClick={() => ouvrir(visite.id)}
                    onKeyDown={(e) => e.key === 'Enter' && ouvrir(visite.id)}
                    className={`cursor-grab outline-none focus-visible:rounded-2xl focus-visible:ring-4 focus-visible:ring-sky-400/40 active:cursor-grabbing ${s.isDragging ? '' : 'animate-entree'}`}
                    aria-label={`Camion ${visite.camion.matricule}. Glisser pour déplacer, Entrée pour ouvrir la fiche.`}
                >
                    <CarteCamion visite={visite} variante={variante} rang={rang} />
                </div>
            )}
        </Draggable>
    );
}

/**
 * Rendu du camion pendant le glisser (dans un portail, au-dessus de tout) :
 * évite les décalages causés par les effets de verre et de 3D des conteneurs.
 */
export function cloneCamion(variante: VarianteCarte) {
    return function Clone(p: DraggableProvided, s: DraggableStateSnapshot, rubric: DraggableRubric) {
        return <CloneCamion p={p} s={s} id={rubric.draggableId} variante={variante} />;
    };
}

function CloneCamion({ p, s, id, variante }: { p: DraggableProvided; s: DraggableStateSnapshot; id: string; variante: VarianteCarte }) {
    const visite = useSite((st) => st.etat?.visites.find((v) => v.id === id));
    return (
        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
            {visite && <CarteCamion visite={visite} variante={variante} enDeplacement={s.isDragging && !s.isDropAnimating} />}
        </div>
    );
}
