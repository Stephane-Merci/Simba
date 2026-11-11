import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, Search } from 'lucide-react';
import { visitesApi } from '../api/simba';
import { messageErreur } from '../api/client';
import { dateHeure, duree, pluriel, quand } from '../lib/format';
import { OPERATIONS, ZONES, dureeVisite, tempsParZone } from '../lib/parcours';
import { useSite } from '../store/useSite';
import type { Operation, Visite, Zone } from '../types';
import Plaque from '../components/ui/Plaque';
import BadgeOperation from '../components/ui/BadgeOperation';
import Bouton from '../components/ui/Bouton';
import { BarreParcours, ChronologieSejours, IconeZone } from '../components/parcours/Parcours';

type Periode = 'jour' | '7j' | '30j' | 'tout';

const PERIODES: { id: Periode; libelle: string }[] = [
    { id: 'jour', libelle: "Aujourd'hui" },
    { id: '7j', libelle: '7 jours' },
    { id: '30j', libelle: '30 jours' },
    { id: 'tout', libelle: 'Tout' },
];

function debutPeriode(p: Periode): Date | undefined {
    if (p === 'tout') return undefined;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (p === '7j') d.setDate(d.getDate() - 6);
    if (p === '30j') d.setDate(d.getDate() - 29);
    return d;
}

/** Export CSV (séparateur « ; » + BOM pour une ouverture directe dans Excel français). */
function exporterCsv(visites: Visite[]) {
    const minutes = (ms: number) => Math.round(ms / 60000);
    const lignes = [
        ['Matricule', 'Transporteur', 'Chauffeur', 'Opération', 'Arrivée', 'Départ', 'Durée totale (min)', 'Accueil (min)', 'Parking (min)', 'Quai (min)', 'Parcours', 'Note'],
        ...visites.map((v) => {
            const z = tempsParZone(v.sejours, Date.now());
            return [
                v.camion.matricule,
                v.camion.transporteur ?? '',
                v.chauffeur ?? '',
                OPERATIONS[v.operation].libelle,
                dateHeure(v.arrivee),
                v.depart ? dateHeure(v.depart) : '',
                String(v.dureeMinutes ?? ''),
                String(minutes(z.ATTENTE)),
                String(minutes(z.PARKING)),
                String(minutes(z.QUAI)),
                v.sejours.map((s) => s.libelle).join(' > '),
                v.notes ?? '',
            ];
        }),
    ];
    const csv = lignes.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `simba-historique-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Historique() {
    const [q, setQ] = useState('');
    const [operation, setOperation] = useState<Operation | ''>('');
    const [periode, setPeriode] = useState<Periode>('7j');
    const [visites, setVisites] = useState<Visite[]>([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);
    const [ouverte, setOuverte] = useState<string | null>(null);
    // Recharge quand le site change (une sortie apparaît alors dans l'historique)
    const sortiesDuJour = useSite((s) => s.stats?.sortiesDuJour);

    useEffect(() => {
        const t = setTimeout(() => {
            setChargement(true);
            visitesApi
                .historique({ q: q || undefined, operation: operation || undefined, du: debutPeriode(periode)?.toISOString() })
                .then((v) => {
                    setVisites(v);
                    setErreur(null);
                })
                .catch((e) => setErreur(messageErreur(e)))
                .finally(() => setChargement(false));
        }, 250);
        return () => clearTimeout(t);
    }, [q, operation, periode, sortiesDuJour]);

    const resume = useMemo(() => {
        const n = visites.length || 1;
        const totaux: Record<Zone, number> = { ATTENTE: 0, PARKING: 0, QUAI: 0 };
        let total = 0;
        for (const v of visites) {
            const z = tempsParZone(v.sejours, Date.now());
            (Object.keys(totaux) as Zone[]).forEach((k) => (totaux[k] += z[k]));
            total += dureeVisite(v, Date.now());
        }
        return {
            moyenne: total / n,
            parZone: Object.fromEntries((Object.keys(totaux) as Zone[]).map((k) => [k, totaux[k] / n])) as Record<Zone, number>,
            chargements: visites.filter((v) => v.operation === 'CHARGEMENT').length,
        };
    }, [visites]);

    return (
        <div className="space-y-5 animate-apparition">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Historique des passages</h1>
                    <p className="mt-1 text-sm text-slate-500">Tous les camions sortis, avec le temps passé dans chaque zone.</p>
                </div>
                <Bouton variante="secondaire" icone={<Download size={16} />} onClick={() => exporterCsv(visites)} disabled={visites.length === 0}>
                    Exporter (Excel)
                </Bouton>
            </div>

            {/* Filtres */}
            <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
                <div className="relative min-w-[220px] flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="field pl-10" placeholder="Matricule, transporteur, chauffeur, quai…" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div className="flex rounded-xl bg-white/50 p-1">
                    {PERIODES.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriode(p.id)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${periode === p.id ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            {p.libelle}
                        </button>
                    ))}
                </div>
                <select className="field w-auto" value={operation} onChange={(e) => setOperation(e.target.value as Operation | '')}>
                    <option value="">Toutes opérations</option>
                    <option value="DECHARGEMENT">Déchargements</option>
                    <option value="CHARGEMENT">Chargements</option>
                </select>
            </div>

            {/* Résumé */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="glass rounded-2xl px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Passages</p>
                    <p className="font-mono text-2xl font-black">{visites.length}</p>
                    <p className="text-xs text-slate-500">
                        {resume.chargements} charg. · {visites.length - resume.chargements} déch.
                    </p>
                </div>
                <div className="glass rounded-2xl px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Durée moyenne</p>
                    <p className="font-mono text-2xl font-black">{visites.length ? duree(resume.moyenne) : '—'}</p>
                    <p className="text-xs text-slate-500">sur site</p>
                </div>
                {(Object.keys(ZONES) as Zone[]).map((z) => (
                    <div key={z} className="glass rounded-2xl px-4 py-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: ZONES[z].couleur }}>
                            <IconeZone zone={z} size={12} /> {ZONES[z].libelle}
                        </p>
                        <p className="font-mono text-2xl font-black">{visites.length ? duree(resume.parZone[z]) : '—'}</p>
                        <p className="text-xs text-slate-500">en moyenne</p>
                    </div>
                ))}
            </div>

            {/* Tableau */}
            <div className="glass overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="px-5 py-3">Camion</th>
                                <th className="px-3 py-3">Opération</th>
                                <th className="px-3 py-3">Arrivée</th>
                                <th className="px-3 py-3">Départ</th>
                                <th className="w-[28%] px-3 py-3">Parcours</th>
                                <th className="px-5 py-3 text-right">Durée</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visites.map((v) => {
                                const fin = v.depart ? new Date(v.depart).getTime() : Date.now();
                                const deplie = ouverte === v.id;
                                return (
                                    <Fragment key={v.id}>
                                        <tr
                                            onClick={() => setOuverte(deplie ? null : v.id)}
                                            className={`cursor-pointer border-b border-white/50 transition hover:bg-white/50 ${deplie ? 'bg-white/50' : ''}`}
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <ChevronDown size={14} className={`text-slate-400 transition ${deplie ? 'rotate-180' : ''}`} />
                                                    <div>
                                                        <Plaque matricule={v.camion.matricule} />
                                                        <p className="mt-1 text-xs text-slate-500">{[v.camion.transporteur, v.chauffeur].filter(Boolean).join(' · ') || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3"><BadgeOperation operation={v.operation} /></td>
                                            <td className="px-3 py-3 font-medium text-slate-700">{quand(v.arrivee)}</td>
                                            <td className="px-3 py-3 font-medium text-slate-700">{v.depart ? quand(v.depart) : '—'}</td>
                                            <td className="px-3 py-3">
                                                <BarreParcours sejours={v.sejours} maintenant={fin} />
                                                <p className="mt-1 truncate text-[11px] text-slate-500">{v.sejours.map((s) => s.libelle).join(' → ')}</p>
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono font-extrabold text-slate-900">{duree(dureeVisite(v, fin))}</td>
                                        </tr>
                                        {deplie && (
                                            <tr className="border-b border-white/50 bg-white/30">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                                                        <ChronologieSejours sejours={v.sejours} maintenant={fin} />
                                                        <div className="space-y-2 text-sm">
                                                            <p><span className="font-semibold text-slate-500">Arrivée :</span> {dateHeure(v.arrivee)}</p>
                                                            {v.depart && <p><span className="font-semibold text-slate-500">Départ :</span> {dateHeure(v.depart)}</p>}
                                                            {v.notes && <p className="rounded-xl bg-white/60 p-3 text-slate-700">{v.notes}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {erreur && <p className="p-6 text-center text-sm font-semibold text-rose-600">{erreur}</p>}
                {!chargement && !erreur && visites.length === 0 && (
                    <div className="p-14 text-center">
                        <p className="font-bold text-slate-700">Aucun passage trouvé</p>
                        <p className="mt-1 text-sm text-slate-500">Modifiez la période ou la recherche.</p>
                    </div>
                )}
                {chargement && visites.length === 0 && <div className="p-14 text-center text-sm text-slate-400">Chargement…</div>}
                {visites.length >= 300 && (
                    <p className="border-t border-white/60 p-3 text-center text-xs text-slate-500">
                        Affichage limité aux {pluriel(300, 'passage')} les plus récents — affinez la recherche.
                    </p>
                )}
            </div>
        </div>
    );
}
