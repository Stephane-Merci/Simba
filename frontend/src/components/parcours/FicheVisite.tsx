import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DoorOpen, Trash2, User, Truck, X } from 'lucide-react';
import { visitesApi } from '../../api/simba';
import { messageErreur } from '../../api/client';
import { chrono, duree, quand } from '../../lib/format';
import { OPERATIONS, ZONES, dureeVisite, sejourActuel } from '../../lib/parcours';
import { useMaintenant } from '../../hooks/useMaintenant';
import { useSite } from '../../store/useSite';
import { confirmer, notifier, useUi } from '../../store/useUi';
import type { Destination, Operation } from '../../types';
import Plaque from '../ui/Plaque';
import Bouton from '../ui/Bouton';
import Camion3D from '../ui/Camion3D';
import { IconeOperation } from '../ui/BadgeOperation';
import ChoixDestination from './ChoixDestination';
import { BarreParcours, ChronologieSejours, IconeZone, RepartitionZones } from './Parcours';

/** Fiche latérale d'un camion présent : position, déplacement, parcours, sortie. */
export default function FicheVisite() {
    const id = useUi((s) => s.visiteOuverte);
    const fermer = useUi((s) => s.fermerVisite);
    const ouvrirSortie = useUi((s) => s.ouvrirSortie);
    const etat = useSite((s) => s.etat);
    const deplacer = useSite((s) => s.deplacer);
    const annuler = useSite((s) => s.annuler);
    const remplacerVisite = useSite((s) => s.remplacerVisite);
    const maintenant = useMaintenant();
    const [enCours, setEnCours] = useState(false);

    const visite = etat?.visites.find((v) => v.id === id);
    const [notes, setNotes] = useState('');
    useEffect(() => setNotes(visite?.notes ?? ''), [visite?.id, visite?.notes]);

    useEffect(() => {
        if (!id) return;
        const surTouche = (e: KeyboardEvent) => e.key === 'Escape' && fermer();
        window.addEventListener('keydown', surTouche);
        return () => window.removeEventListener('keydown', surTouche);
    }, [id, fermer]);

    // La visite a disparu (sortie enregistrée sur un autre poste) → on ferme.
    useEffect(() => {
        if (id && etat && !visite) fermer();
    }, [id, etat, visite, fermer]);

    if (!id || !etat || !visite) return null;

    const actuel = sejourActuel(visite);
    const valeurActuelle: Destination | null = actuel
        ? actuel.zone === 'QUAI' && actuel.quaiId
            ? { zone: 'QUAI', quaiId: actuel.quaiId }
            : actuel.zone === 'PARKING' && actuel.parkingSectionId
              ? { zone: 'PARKING', parkingSectionId: actuel.parkingSectionId }
              : { zone: 'ATTENTE' }
        : null;

    const allerA = async (d: Destination) => {
        setEnCours(true);
        await deplacer(visite.id, d);
        setEnCours(false);
    };

    const modifier = async (data: { operation?: Operation; notes?: string }) => {
        try {
            remplacerVisite(await visitesApi.modifier(visite.id, data));
            notifier({ type: 'succes', titre: 'Fiche mise à jour' });
        } catch (e) {
            notifier({ type: 'erreur', titre: 'Modification impossible', message: messageErreur(e) });
        }
    };

    const annulerArrivee = async () => {
        const ok = await confirmer({
            titre: 'Annuler cette arrivée ?',
            message: `L'arrivée de ${visite.camion.matricule} sera supprimée comme si elle n'avait jamais été saisie. À utiliser uniquement en cas d'erreur de saisie — pour un départ, utilisez « Enregistrer la sortie ».`,
            libelleOk: "Annuler l'arrivée",
            danger: true,
        });
        if (!ok) return;
        try {
            await annuler(visite.id);
            notifier({ type: 'info', titre: `Arrivée de ${visite.camion.matricule} annulée` });
            fermer();
        } catch (e) {
            notifier({ type: 'erreur', titre: 'Annulation impossible', message: messageErreur(e) });
        }
    };

    const o = OPERATIONS[visite.operation];

    return createPortal(
        <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/20 backdrop-blur-[2px] animate-fondu" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
            <aside className="glass-strong animate-tiroir flex h-full w-full max-w-md flex-col sm:m-3 sm:h-[calc(100%-1.5rem)] sm:rounded-3xl" role="dialog" aria-label={`Fiche ${visite.camion.matricule}`}>
                {/* En-tête */}
                <div className="relative overflow-hidden rounded-t-3xl px-6 pb-5 pt-6" style={{ background: `linear-gradient(135deg, ${o.douce}, transparent 70%)` }}>
                    <button onClick={fermer} className="absolute right-4 top-4 rounded-xl p-2 text-slate-500 hover:bg-white/60" aria-label="Fermer">
                        <X size={18} />
                    </button>
                    <div className="flex items-end gap-4">
                        <Camion3D operation={visite.operation} largeur={110} />
                        <div className="min-w-0 pb-1">
                            <Plaque matricule={visite.camion.matricule} taille="lg" />
                            <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                                {visite.camion.transporteur && (
                                    <p className="flex items-center gap-1.5"><Truck size={12} /> {visite.camion.transporteur}</p>
                                )}
                                {visite.chauffeur && (
                                    <p className="flex items-center gap-1.5"><User size={12} /> {visite.chauffeur}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Opération (modifiable en un clic) */}
                    <div className="mt-4 inline-flex rounded-xl bg-white/60 p-1">
                        {(['DECHARGEMENT', 'CHARGEMENT'] as Operation[]).map((op) => (
                            <button
                                key={op}
                                onClick={() => op !== visite.operation && modifier({ operation: op })}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    op === visite.operation ? 'bg-white shadow' : 'text-slate-500 hover:text-slate-800'
                                }`}
                                style={op === visite.operation ? { color: OPERATIONS[op].couleur } : undefined}
                            >
                                <IconeOperation operation={op} size={13} />
                                {OPERATIONS[op].libelle}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="scroll-fin flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    {/* Position actuelle */}
                    {actuel && (
                        <section className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/60 p-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: ZONES[actuel.zone].couleur }}>
                                    <IconeZone zone={actuel.zone} size={20} />
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Actuellement</p>
                                    <p className="text-lg font-extrabold text-slate-900">{actuel.libelle}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-xl font-extrabold text-slate-900">{chrono(maintenant - new Date(actuel.debut).getTime())}</p>
                                <p className="text-[11px] text-slate-500">depuis {quand(actuel.debut, maintenant)}</p>
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="mb-2 text-sm font-extrabold text-slate-800">Déplacer vers</h3>
                        <ChoixDestination etat={etat} valeur={valeurActuelle} onChoisir={allerA} visiteId={visite.id} desactive={enCours} />
                    </section>

                    <section>
                        <div className="mb-2 flex items-baseline justify-between">
                            <h3 className="text-sm font-extrabold text-slate-800">Parcours sur site</h3>
                            <p className="text-xs text-slate-500">
                                arrivé à {quand(visite.arrivee, maintenant)} · <span className="font-bold text-slate-700">{duree(dureeVisite(visite, maintenant))}</span>
                            </p>
                        </div>
                        <BarreParcours sejours={visite.sejours} maintenant={maintenant} />
                        <div className="mt-3">
                            <RepartitionZones sejours={visite.sejours} maintenant={maintenant} />
                        </div>
                        <div className="mt-4">
                            <ChronologieSejours sejours={visite.sejours} maintenant={maintenant} />
                        </div>
                    </section>

                    <section>
                        <label className="label" htmlFor="notes-visite">Note</label>
                        <textarea
                            id="notes-visite"
                            rows={2}
                            className="field resize-none"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={() => notes !== (visite.notes ?? '') && modifier({ notes })}
                            placeholder="Ajouter une remarque…"
                        />
                    </section>
                </div>

                <div className="space-y-2 border-t border-white/60 px-6 py-4">
                    <Bouton variante="danger" taille="lg" className="w-full" icone={<DoorOpen size={18} />} onClick={() => ouvrirSortie(visite.id)}>
                        Enregistrer la sortie
                    </Bouton>
                    <button onClick={annulerArrivee} className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-rose-600">
                        <Trash2 size={12} /> Annuler l'arrivée (erreur de saisie)
                    </button>
                </div>
            </aside>
        </div>,
        document.body,
    );
}
