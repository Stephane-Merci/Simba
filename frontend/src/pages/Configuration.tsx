import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Check, Minus, ParkingSquare, Pencil, Plus, Trash2, Warehouse, X } from 'lucide-react';
import { infraApi } from '../api/simba';
import { messageErreur } from '../api/client';
import { occupation } from '../lib/parcours';
import { pluriel } from '../lib/format';
import { useSite } from '../store/useSite';
import { confirmer, notifier } from '../store/useUi';
import type { Parking, Quai } from '../types';
import Bouton from '../components/ui/Bouton';

/** Exécute une action API, notifie, puis recharge l'état du site. */
async function action(fn: () => Promise<unknown>, succes: string) {
    try {
        await fn();
        notifier({ type: 'succes', titre: succes });
        await useSite.getState().charger();
        return true;
    } catch (e) {
        notifier({ type: 'erreur', titre: 'Opération impossible', message: messageErreur(e) });
        return false;
    }
}

function Compteur({ valeur, onChange, min = 1 }: { valeur: number; onChange: (n: number) => void; min?: number }) {
    return (
        <div className="inline-flex items-center rounded-xl border border-slate-200/80 bg-white/70">
            <button type="button" className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30" onClick={() => onChange(Math.max(min, valeur - 1))} disabled={valeur <= min} aria-label="Moins">
                <Minus size={14} />
            </button>
            <input
                type="number"
                min={min}
                value={valeur}
                onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
                className="w-12 bg-transparent text-center font-mono text-sm font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button type="button" className="p-2 text-slate-500 hover:text-slate-900" onClick={() => onChange(valeur + 1)} aria-label="Plus">
                <Plus size={14} />
            </button>
        </div>
    );
}

function LigneQuai({ quai, occupe, premier, dernier, onMonter, onDescendre }: { quai: Quai; occupe?: string; premier: boolean; dernier: boolean; onMonter: () => void; onDescendre: () => void }) {
    const [edition, setEdition] = useState(false);
    const [nom, setNom] = useState(quai.nom);
    const [description, setDescription] = useState(quai.description ?? '');

    const enregistrer = async (e?: FormEvent) => {
        e?.preventDefault();
        if (await action(() => infraApi.modifierQuai(quai.id, { nom, description: description || null }), 'Quai modifié')) setEdition(false);
    };
    const supprimer = async () => {
        const ok = await confirmer({ titre: `Supprimer ${quai.nom} ?`, message: "Le quai n'apparaîtra plus sur le tableau de bord. L'historique des passages est conservé.", libelleOk: 'Supprimer', danger: true });
        if (ok) await action(() => infraApi.supprimerQuai(quai.id), `${quai.nom} supprimé`);
    };

    if (edition) {
        return (
            <form onSubmit={enregistrer} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/70 p-2">
                <input autoFocus className="field w-36 flex-1" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
                <input className="field flex-[2]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (facultatif)" />
                <button type="submit" className="rounded-lg bg-emerald-500 p-2 text-white" aria-label="Enregistrer"><Check size={16} /></button>
                <button type="button" onClick={() => setEdition(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="Annuler"><X size={16} /></button>
            </form>
        );
    }

    return (
        <div className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/60">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600"><Warehouse size={17} /></span>
            <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{quai.nom}</p>
                <p className="truncate text-xs text-slate-500">{occupe ? `Occupé par ${occupe}` : quai.description || 'Libre'}</p>
            </div>
            <div className="flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
                <button onClick={onMonter} disabled={premier} className="rounded-lg p-1.5 text-slate-500 hover:bg-white disabled:opacity-20" title="Monter"><ArrowUp size={15} /></button>
                <button onClick={onDescendre} disabled={dernier} className="rounded-lg p-1.5 text-slate-500 hover:bg-white disabled:opacity-20" title="Descendre"><ArrowDown size={15} /></button>
                <button onClick={() => setEdition(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white" title="Modifier"><Pencil size={15} /></button>
                <button onClick={supprimer} disabled={!!occupe} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20" title={occupe ? 'Quai occupé' : 'Supprimer'}><Trash2 size={15} /></button>
            </div>
        </div>
    );
}

function LigneParking({ parking, presents }: { parking: Parking; presents: number }) {
    const [nom, setNom] = useState(parking.nom);
    const [capacite, setCapacite] = useState(parking.capacite);
    const modifie = nom !== parking.nom || capacite !== parking.capacite;

    const supprimer = async () => {
        const ok = await confirmer({ titre: `Supprimer ${parking.nom} ?`, message: "Cette zone de parking sera supprimée. L'historique des passages est conservé.", libelleOk: 'Supprimer', danger: true });
        if (ok) await action(() => infraApi.supprimerParking(parking.id), `${parking.nom} supprimé`);
    };

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/60">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><ParkingSquare size={17} /></span>
            <div className="min-w-[140px] flex-1">
                <input className="w-full rounded-lg bg-transparent px-1 font-bold text-slate-900 outline-none focus:bg-white" value={nom} onChange={(e) => setNom(e.target.value)} />
                <p className="px-1 text-xs text-slate-500">{presents > 0 ? `${pluriel(presents, 'camion')} actuellement` : 'Vide'}</p>
            </div>
            <Compteur valeur={capacite} onChange={setCapacite} min={Math.max(1, presents)} />
            <span className="text-xs text-slate-500">places</span>
            {modifie && (
                <Bouton taille="sm" variante="succes" onClick={() => action(() => infraApi.modifierParking(parking.id, { nom, capacite }), 'Parking modifié')}>
                    Enregistrer
                </Bouton>
            )}
            <button onClick={supprimer} disabled={presents > 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20" title={presents ? 'Parking occupé' : 'Supprimer'}>
                <Trash2 size={15} />
            </button>
        </div>
    );
}

export default function Configuration() {
    const etat = useSite((s) => s.etat);
    const [nomQuai, setNomQuai] = useState('');
    const [nomParking, setNomParking] = useState('');
    const [capacite, setCapacite] = useState(10);

    if (!etat) return null;
    const { parQuai, parParking } = occupation(etat);

    const ajouterQuai = async (e: FormEvent) => {
        e.preventDefault();
        const nom = nomQuai.trim() || `Quai ${etat.quais.length + 1}`;
        if (await action(() => infraApi.creerQuai({ nom }), `${nom} ajouté`)) setNomQuai('');
    };
    const ajouterParking = async (e: FormEvent) => {
        e.preventDefault();
        if (!nomParking.trim()) return;
        if (await action(() => infraApi.creerParking({ nom: nomParking, capacite }), `${nomParking} ajouté`)) {
            setNomParking('');
            setCapacite(10);
        }
    };
    const deplacerQuai = (i: number, sens: -1 | 1) => {
        const ids = etat.quais.map((q) => q.id);
        [ids[i], ids[i + sens]] = [ids[i + sens], ids[i]];
        void action(() => infraApi.ordonnerQuais(ids), 'Ordre des quais mis à jour');
    };

    return (
        <div className="space-y-5 animate-apparition">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Configuration du site</h1>
                <p className="mt-1 text-sm text-slate-500">Quais de chargement / déchargement et zones de parking.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <section className="glass rounded-3xl p-5">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
                        <Warehouse size={18} className="text-orange-500" /> Quais <span className="text-sm font-semibold text-slate-400">({etat.quais.length})</span>
                    </h2>
                    <p className="mb-4 text-sm text-slate-500">Un quai accueille un seul camion à la fois.</p>
                    <form onSubmit={ajouterQuai} className="mb-3 flex gap-2">
                        <input className="field" value={nomQuai} onChange={(e) => setNomQuai(e.target.value)} placeholder={`Quai ${etat.quais.length + 1}`} />
                        <Bouton type="submit" icone={<Plus size={16} />}>Ajouter</Bouton>
                    </form>
                    <div className="space-y-1">
                        {etat.quais.map((q, i) => (
                            <LigneQuai
                                key={`${q.id}-${q.nom}-${q.description}`}
                                quai={q}
                                occupe={parQuai.get(q.id)?.camion.matricule}
                                premier={i === 0}
                                dernier={i === etat.quais.length - 1}
                                onMonter={() => deplacerQuai(i, -1)}
                                onDescendre={() => deplacerQuai(i, 1)}
                            />
                        ))}
                    </div>
                </section>

                <section className="glass rounded-3xl p-5">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
                        <ParkingSquare size={18} className="text-emerald-500" /> Parkings <span className="text-sm font-semibold text-slate-400">({etat.parkings.length})</span>
                    </h2>
                    <p className="mb-4 text-sm text-slate-500">Zones où les camions patientent avant ou entre deux quais.</p>
                    <form onSubmit={ajouterParking} className="mb-3 flex flex-wrap items-center gap-2">
                        <input className="field min-w-[160px] flex-1" value={nomParking} onChange={(e) => setNomParking(e.target.value)} placeholder="Nom (ex : Parking Nord)" />
                        <Compteur valeur={capacite} onChange={setCapacite} />
                        <Bouton type="submit" icone={<Plus size={16} />} disabled={!nomParking.trim()}>Ajouter</Bouton>
                    </form>
                    <div className="space-y-1">
                        {etat.parkings.map((p) => (
                            <LigneParking key={`${p.id}-${p.nom}-${p.capacite}`} parking={p} presents={parParking.get(p.id)?.length ?? 0} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
