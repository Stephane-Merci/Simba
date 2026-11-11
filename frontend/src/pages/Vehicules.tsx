import { useCallback, useEffect, useState } from 'react';
import { Eye, LogIn, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { camionsApi } from '../api/simba';
import { messageErreur } from '../api/client';
import { pluriel, quand } from '../lib/format';
import { useSite } from '../store/useSite';
import { confirmer, notifier, useUi } from '../store/useUi';
import type { CamionRegistre } from '../types';
import Plaque from '../components/ui/Plaque';
import Camion3D from '../components/ui/Camion3D';
import Bouton from '../components/ui/Bouton';
import Modale from '../components/ui/Modale';
import { IconeZone } from '../components/parcours/Parcours';

function FormulaireCamion({ camion, ouvert, onFermer, onEnregistre }: { camion: CamionRegistre | null; ouvert: boolean; onFermer: () => void; onEnregistre: () => void }) {
    const [matricule, setMatricule] = useState('');
    const [transporteur, setTransporteur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    useEffect(() => {
        if (!ouvert) return;
        setMatricule(camion?.matricule ?? '');
        setTransporteur(camion?.transporteur ?? '');
        setErreur(null);
    }, [ouvert, camion]);

    const enregistrer = async () => {
        setEnvoi(true);
        try {
            if (camion) await camionsApi.modifier(camion.id, { matricule, transporteur: transporteur || null });
            else await camionsApi.creer({ matricule, transporteur: transporteur || undefined });
            notifier({ type: 'succes', titre: camion ? 'Véhicule modifié' : 'Véhicule ajouté' });
            onEnregistre();
            onFermer();
        } catch (e) {
            setErreur(messageErreur(e));
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <Modale
            ouvert={ouvert}
            onFermer={onFermer}
            titre={camion ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
            sousTitre={camion ? undefined : "Pré-enregistrement facultatif : un camion est aussi créé automatiquement à l'accueil."}
            largeur="max-w-md"
            pied={
                <>
                    <Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
                    <Bouton onClick={enregistrer} chargement={envoi} disabled={!matricule.trim()}>Enregistrer</Bouton>
                </>
            }
        >
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void enregistrer(); }}>
                <div>
                    <label className="label" htmlFor="v-matricule">Matricule</label>
                    <input id="v-matricule" autoFocus className="field font-mono text-lg font-bold tracking-widest" value={matricule} onChange={(e) => setMatricule(e.target.value.toUpperCase())} placeholder="AB-123-CD" />
                </div>
                <div>
                    <label className="label" htmlFor="v-transporteur">Transporteur</label>
                    <input id="v-transporteur" className="field" value={transporteur} onChange={(e) => setTransporteur(e.target.value)} placeholder="Facultatif" />
                </div>
                {erreur && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{erreur}</p>}
                <button type="submit" hidden />
            </form>
        </Modale>
    );
}

export default function Vehicules() {
    const [q, setQ] = useState('');
    const [camions, setCamions] = useState<CamionRegistre[]>([]);
    const [chargement, setChargement] = useState(true);
    const [edition, setEdition] = useState<{ ouvert: boolean; camion: CamionRegistre | null }>({ ouvert: false, camion: null });
    const ouvrirAccueil = useUi((s) => s.ouvrirAccueil);
    const ouvrirVisite = useUi((s) => s.ouvrirVisite);
    // Se met à jour quand le site change (arrivée, sortie…)
    const visitesSurSite = useSite((s) => s.etat?.visites);

    const charger = useCallback(() => {
        camionsApi
            .rechercher(q)
            .then(setCamions)
            .catch((e) => notifier({ type: 'erreur', titre: 'Chargement impossible', message: messageErreur(e) }))
            .finally(() => setChargement(false));
    }, [q]);

    useEffect(() => {
        const t = setTimeout(charger, 250);
        return () => clearTimeout(t);
    }, [charger, visitesSurSite]);

    const supprimer = async (c: CamionRegistre) => {
        const ok = await confirmer({
            titre: `Supprimer ${c.matricule} ?`,
            message: `Le véhicule et son historique (${pluriel(c._count.visites, 'passage')}) seront définitivement supprimés.`,
            libelleOk: 'Supprimer',
            danger: true,
        });
        if (!ok) return;
        try {
            await camionsApi.supprimer(c.id);
            notifier({ type: 'succes', titre: `${c.matricule} supprimé` });
            charger();
        } catch (e) {
            notifier({ type: 'erreur', titre: 'Suppression impossible', message: messageErreur(e) });
        }
    };

    return (
        <div className="space-y-5 animate-apparition">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Véhicules</h1>
                    <p className="mt-1 text-sm text-slate-500">Registre des camions déjà venus sur le site.</p>
                </div>
                <Bouton variante="secondaire" icone={<Plus size={16} />} onClick={() => setEdition({ ouvert: true, camion: null })}>
                    Ajouter un véhicule
                </Bouton>
            </div>

            <div className="glass relative rounded-2xl p-3">
                <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="field pl-10" placeholder="Rechercher un matricule ou un transporteur…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {camions.map((c) => {
                    const derniere = c.visites[0];
                    const surSite = !!derniere && !derniere.depart;
                    const ou = surSite ? derniere.sejours[0] : undefined;
                    return (
                        <div key={c.id} className="glass group flex flex-col rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-2xl">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5">
                                    <Plaque matricule={c.matricule} taille="lg" />
                                    <p className="text-sm text-slate-500">{c.transporteur ?? 'Transporteur non renseigné'}</p>
                                </div>
                                <Camion3D operation={surSite ? derniere.operation : undefined} largeur={70} />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                {surSite ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-700">
                                        <span className="voyant h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Sur site{ou && <> · <IconeZone zone={ou.zone} size={11} /> {ou.libelle}</>}
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-slate-900/5 px-2.5 py-1 font-bold text-slate-500">Hors site</span>
                                )}
                                <span className="text-slate-500">
                                    {pluriel(c._count.visites, 'passage')}
                                    {derniere?.depart && <> · dernier {quand(derniere.depart)}</>}
                                </span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 border-t border-white/60 pt-3">
                                {surSite ? (
                                    <Bouton taille="sm" variante="secondaire" icone={<Eye size={14} />} onClick={() => ouvrirVisite(derniere.id)}>
                                        Voir la fiche
                                    </Bouton>
                                ) : (
                                    <Bouton taille="sm" icone={<LogIn size={14} />} onClick={() => ouvrirAccueil(c.matricule)}>
                                        Enregistrer une arrivée
                                    </Bouton>
                                )}
                                <div className="ml-auto flex gap-1">
                                    <button className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-800" title="Modifier" onClick={() => setEdition({ ouvert: true, camion: c })}>
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                        title={surSite ? 'Impossible : le camion est sur site' : 'Supprimer'}
                                        disabled={surSite}
                                        onClick={() => supprimer(c)}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!chargement && camions.length === 0 && (
                <div className="glass rounded-3xl p-14 text-center">
                    <p className="font-bold text-slate-700">{q ? 'Aucun véhicule trouvé' : 'Aucun véhicule enregistré'}</p>
                    <p className="mt-1 text-sm text-slate-500">Les camions sont ajoutés automatiquement lors de leur arrivée à l'accueil.</p>
                </div>
            )}

            <FormulaireCamion
                ouvert={edition.ouvert}
                camion={edition.camion}
                onFermer={() => setEdition({ ouvert: false, camion: null })}
                onEnregistre={charger}
            />
        </div>
    );
}
