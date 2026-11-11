import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, History, Sparkles, TriangleAlert } from 'lucide-react';
import { camionsApi } from '../../api/simba';
import { messageErreur } from '../../api/client';
import { cleMatricule, pluriel, quand } from '../../lib/format';
import { OPERATIONS } from '../../lib/parcours';
import { useTilt } from '../../hooks/useTilt';
import { useSite } from '../../store/useSite';
import { notifier, useUi } from '../../store/useUi';
import type { CamionRegistre, Destination, Operation } from '../../types';
import Modale from '../ui/Modale';
import Bouton from '../ui/Bouton';
import Plaque from '../ui/Plaque';
import Camion3D from '../ui/Camion3D';
import ChoixDestination from './ChoixDestination';

function TuileOperation({ operation, actif, onClick }: { operation: Operation; actif: boolean; onClick: () => void }) {
    const o = OPERATIONS[operation];
    const tilt = useTilt(10);
    return (
        <button
            type="button"
            onClick={onClick}
            {...tilt}
            className={`tilt group relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 pb-3 pt-4 text-center transition ${
                actif ? 'bg-white shadow-xl' : 'border-white/80 bg-white/50 hover:bg-white/80'
            }`}
            style={actif ? { borderColor: o.couleur, boxShadow: `0 18px 40px -16px ${o.couleur}` } : undefined}
            aria-pressed={actif}
        >
            {actif && <CheckCircle2 size={18} className="absolute right-2.5 top-2.5" style={{ color: o.couleur }} />}
            <span className="tilt-pop">
                <Camion3D operation={operation} largeur={92} roule={actif} />
            </span>
            <span className="text-base font-extrabold text-slate-900">{o.libelle}</span>
            <span className="text-xs leading-snug text-slate-500">{o.aide}</span>
        </button>
    );
}

/**
 * Accueil d'un camion : saisie du matricule (le camion est retrouvé s'il est déjà
 * venu), type d'opération, puis placement immédiat (accueil, quai ou parking).
 */
export default function ModaleAccueil() {
    const { ouvert, matricule: prerempli } = useUi((s) => s.accueil);
    const fermer = useUi((s) => s.fermerAccueil);
    const ouvrirVisite = useUi((s) => s.ouvrirVisite);
    const etat = useSite((s) => s.etat);
    const arrivee = useSite((s) => s.arrivee);

    const [matricule, setMatricule] = useState('');
    const [transporteur, setTransporteur] = useState('');
    const [chauffeur, setChauffeur] = useState('');
    const [notes, setNotes] = useState('');
    const [operation, setOperation] = useState<Operation | null>(null);
    const [destination, setDestination] = useState<Destination>({ zone: 'ATTENTE' });
    const [suggestions, setSuggestions] = useState<CamionRegistre[]>([]);
    const [recherche, setRecherche] = useState(false);
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const champ = useRef<HTMLInputElement>(null);

    // Réinitialisation à chaque ouverture
    useEffect(() => {
        if (!ouvert) return;
        setMatricule(prerempli ?? '');
        setTransporteur('');
        setChauffeur('');
        setNotes('');
        setOperation(null);
        setDestination({ zone: 'ATTENTE' });
        setSuggestions([]);
        setErreur(null);
        setTimeout(() => champ.current?.focus(), 50);
    }, [ouvert, prerempli]);

    // Recherche des camions déjà connus pendant la saisie
    useEffect(() => {
        if (!ouvert) return;
        const cle = cleMatricule(matricule);
        if (cle.length < 2) {
            setSuggestions([]);
            return;
        }
        setRecherche(true);
        const t = setTimeout(() => {
            camionsApi
                .rechercher(matricule, 6)
                .then(setSuggestions)
                .catch(() => setSuggestions([]))
                .finally(() => setRecherche(false));
        }, 220);
        return () => clearTimeout(t);
    }, [matricule, ouvert]);

    const connu = useMemo(
        () => suggestions.find((c) => cleMatricule(c.matricule) === cleMatricule(matricule)),
        [suggestions, matricule],
    );
    const derniere = connu?.visites[0];
    const dejaSurSite = !!derniere && !derniere.depart;

    // Pré-remplit le transporteur d'un camion connu
    useEffect(() => {
        if (connu?.transporteur) setTransporteur((t) => t || connu.transporteur!);
    }, [connu]);

    const pret = cleMatricule(matricule).length > 0 && operation && !dejaSurSite;

    const valider = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!pret || !operation) return;
        setEnvoi(true);
        setErreur(null);
        try {
            const v = await arrivee({
                matricule,
                transporteur: transporteur || undefined,
                chauffeur: chauffeur || undefined,
                notes: notes || undefined,
                operation,
                destination,
            });
            const lieu = v.sejours[v.sejours.length - 1]?.libelle ?? 'Accueil';
            notifier({
                type: 'succes',
                titre: `${v.camion.matricule} enregistré`,
                message: `${OPERATIONS[operation].libelle} · ${lieu}`,
            });
            fermer();
        } catch (err) {
            setErreur(messageErreur(err));
        } finally {
            setEnvoi(false);
        }
    };

    if (!etat) return null;

    return (
        <Modale
            ouvert={ouvert}
            onFermer={fermer}
            titre="Nouvelle arrivée"
            sousTitre="Enregistrez le camion qui se présente à l'accueil"
            largeur="max-w-2xl"
            pied={
                <>
                    <Bouton variante="fantome" onClick={fermer}>
                        Annuler
                    </Bouton>
                    <Bouton onClick={() => valider()} chargement={envoi} disabled={!pret} taille="lg">
                        Enregistrer l'arrivée
                    </Bouton>
                </>
            }
        >
            <form onSubmit={valider} className="space-y-6">
                {/* 1. Matricule */}
                <section>
                    <label className="label" htmlFor="matricule">
                        1 · Matricule du camion
                    </label>
                    <div className="relative">
                        <input
                            id="matricule"
                            ref={champ}
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                            placeholder="AB-123-CD"
                            autoComplete="off"
                            spellCheck={false}
                            className="field h-14 pl-4 font-mono text-2xl font-extrabold tracking-widest"
                        />
                        {recherche && (
                            <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                        )}
                    </div>

                    {/* Statut du matricule */}
                    {cleMatricule(matricule).length >= 2 && !recherche && (
                        <div className="mt-2 animate-apparition">
                            {dejaSurSite ? (
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 px-4 py-3">
                                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                                        <TriangleAlert size={16} /> {connu!.matricule} est déjà sur le site.
                                    </p>
                                    <Bouton
                                        taille="sm"
                                        variante="secondaire"
                                        onClick={() => {
                                            fermer();
                                            ouvrirVisite(derniere!.id);
                                        }}
                                    >
                                        Voir sa fiche
                                    </Bouton>
                                </div>
                            ) : connu ? (
                                <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/70 bg-emerald-50/80 px-4 py-3">
                                    <History size={18} className="shrink-0 text-emerald-600" />
                                    <p className="text-sm text-emerald-900">
                                        <span className="font-bold">Camion connu</span> — {pluriel(connu._count.visites, 'passage')}
                                        {derniere?.depart && <>, dernier le {quand(derniere.depart)}</>}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-2xl border border-sky-300/70 bg-sky-50/80 px-4 py-3">
                                    <Sparkles size={18} className="shrink-0 text-sky-600" />
                                    <p className="text-sm text-sky-900">
                                        <span className="font-bold">Premier passage</span> — le camion sera ajouté au registre.
                                    </p>
                                </div>
                            )}
                            {/* Autres camions proches (faute de frappe) */}
                            {suggestions.filter((c) => c !== connu).length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs text-slate-500">Vouliez-vous dire :</span>
                                    {suggestions
                                        .filter((c) => c !== connu)
                                        .slice(0, 4)
                                        .map((c) => (
                                            <button key={c.id} type="button" onClick={() => setMatricule(c.matricule)} className="transition hover:scale-105">
                                                <Plaque matricule={c.matricule} taille="sm" />
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="label" htmlFor="transporteur">Transporteur</label>
                            <input id="transporteur" className="field" value={transporteur} onChange={(e) => setTransporteur(e.target.value)} placeholder="Facultatif" />
                        </div>
                        <div>
                            <label className="label" htmlFor="chauffeur">Chauffeur</label>
                            <input id="chauffeur" className="field" value={chauffeur} onChange={(e) => setChauffeur(e.target.value)} placeholder="Facultatif" />
                        </div>
                    </div>
                </section>

                {/* 2. Opération */}
                <section>
                    <p className="label">2 · Le camion vient pour…</p>
                    <div className="grid grid-cols-2 gap-3" style={{ perspective: 900 }}>
                        <TuileOperation operation="DECHARGEMENT" actif={operation === 'DECHARGEMENT'} onClick={() => setOperation('DECHARGEMENT')} />
                        <TuileOperation operation="CHARGEMENT" actif={operation === 'CHARGEMENT'} onClick={() => setOperation('CHARGEMENT')} />
                    </div>
                </section>

                {/* 3. Destination */}
                <section>
                    <p className="label">3 · Où l'envoyer ?</p>
                    <ChoixDestination etat={etat} valeur={destination} onChoisir={setDestination} />
                </section>

                <section>
                    <label className="label" htmlFor="notes">Note</label>
                    <textarea id="notes" rows={2} className="field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="N° de commande, remarque… (facultatif)" />
                </section>

                {erreur && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{erreur}</p>}
                {!operation && cleMatricule(matricule) && !dejaSurSite && (
                    <p className="text-center text-xs text-slate-500">Choisissez chargement ou déchargement pour continuer.</p>
                )}
                <button type="submit" hidden />
            </form>
        </Modale>
    );
}
