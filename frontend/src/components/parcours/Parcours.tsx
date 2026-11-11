import { Clock, MapPin, ParkingSquare, Warehouse } from 'lucide-react';
import { ZONES, dureeSejour, tempsParZone } from '../../lib/parcours';
import { duree, quand } from '../../lib/format';
import type { Sejour, Zone } from '../../types';

export function IconeZone({ zone, size = 14 }: { zone: Zone; size?: number }) {
    if (zone === 'QUAI') return <Warehouse size={size} />;
    if (zone === 'PARKING') return <ParkingSquare size={size} />;
    return <MapPin size={size} />;
}

/** Barre horizontale : proportion du temps passé dans chaque séjour. */
export function BarreParcours({ sejours, maintenant, hauteur = 'h-2.5' }: { sejours: Sejour[]; maintenant: number; hauteur?: string }) {
    const total = sejours.reduce((acc, s) => acc + dureeSejour(s, maintenant), 0) || 1;
    return (
        <div className={`flex w-full overflow-hidden rounded-full bg-slate-900/5 ${hauteur}`}>
            {sejours.map((s) => (
                <div
                    key={s.id}
                    title={`${s.libelle} · ${duree(dureeSejour(s, maintenant))}`}
                    className="h-full border-r border-white/70 transition-all duration-700 last:border-r-0"
                    style={{
                        width: `${Math.max(2, (dureeSejour(s, maintenant) / total) * 100)}%`,
                        background: ZONES[s.zone].couleur,
                        opacity: s.fin ? 0.85 : 1,
                    }}
                />
            ))}
        </div>
    );
}

/** Totaux par type de zone (accueil, parking, quai). */
export function RepartitionZones({ sejours, maintenant }: { sejours: Sejour[]; maintenant: number }) {
    const parZone = tempsParZone(sejours, maintenant);
    return (
        <div className="grid grid-cols-3 gap-2">
            {(Object.keys(ZONES) as Zone[]).map((z) => (
                <div key={z} className="rounded-2xl border border-white/70 bg-white/50 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: ZONES[z].couleur }}>
                        <IconeZone zone={z} size={12} />
                        {ZONES[z].libelle}
                    </div>
                    <div className="mt-1 font-mono text-base font-extrabold text-slate-900">
                        {parZone[z] > 0 ? duree(parZone[z]) : '—'}
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Chronologie détaillée : chaque séjour avec heure d'entrée, de sortie et durée. */
export function ChronologieSejours({ sejours, maintenant }: { sejours: Sejour[]; maintenant: number }) {
    return (
        <ol className="relative space-y-1">
            {sejours.map((s, i) => {
                const enCours = !s.fin;
                const couleur = ZONES[s.zone].couleur;
                return (
                    <li key={s.id} className="relative flex gap-3 pb-2">
                        {i < sejours.length - 1 && (
                            <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 rounded bg-slate-200" />
                        )}
                        <span
                            className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${enCours ? 'ring-4 ring-offset-0' : ''}`}
                            style={{ background: couleur, ['--tw-ring-color' as string]: `color-mix(in srgb, ${couleur} 25%, transparent)` }}
                        >
                            <IconeZone zone={s.zone} />
                        </span>
                        <div className="min-w-0 flex-1 rounded-xl px-1 py-0.5">
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="truncate text-sm font-bold text-slate-900">{s.libelle}</p>
                                <p className={`shrink-0 font-mono text-sm font-bold ${enCours ? 'text-slate-900' : 'text-slate-500'}`}>
                                    {duree(dureeSejour(s, maintenant))}
                                </p>
                            </div>
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={11} />
                                {quand(s.debut, maintenant)} → {s.fin ? quand(s.fin, maintenant) : <span className="font-semibold text-emerald-600">en cours</span>}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
