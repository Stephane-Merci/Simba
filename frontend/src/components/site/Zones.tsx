import { Droppable } from '@hello-pangea/dnd';
import { DoorOpen, MapPin, ParkingSquare, Warehouse } from 'lucide-react';
import type { ReactNode } from 'react';
import { ID_ATTENTE, ID_SORTIE, idParking, idQuai } from '../../lib/parcours';
import { pluriel } from '../../lib/format';
import type { Parking, Quai, Visite } from '../../types';
import { CamionGlissable, cloneCamion } from './CarteCamion';

function EnTete({ icone, titre, couleur, droite }: { icone: ReactNode; titre: string; couleur: string; droite?: ReactNode }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-md" style={{ background: couleur }}>
                    {icone}
                </span>
                {titre}
            </h2>
            {droite}
        </div>
    );
}

// ── Accueil / file d'attente ─────────────────────────────────────────────
export function FileAttente({ visites }: { visites: Visite[] }) {
    return (
        <section className="glass flex min-h-0 flex-col rounded-3xl p-4">
            <EnTete
                icone={<MapPin size={15} />}
                titre="Accueil"
                couleur="var(--attente)"
                droite={<span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-700">{pluriel(visites.length, 'camion')}</span>}
            />
            <Droppable droppableId={ID_ATTENTE} renderClone={cloneCamion('liste')}>
                {(p, s) => (
                    <div
                        ref={p.innerRef}
                        {...p.droppableProps}
                        className={`scroll-fin -mx-1 flex min-h-[120px] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl px-1 pb-1 pt-2 transition ${
                            s.isDraggingOver ? 'bg-violet-500/10 ring-2 ring-dashed ring-violet-400' : ''
                        }`}
                    >
                        {visites.map((v, i) => (
                            <CamionGlissable key={v.id} visite={v} index={i} variante="liste" rang={i + 1} />
                        ))}
                        {p.placeholder}
                        {visites.length === 0 && !s.isDraggingOver && (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/70 p-6 text-center">
                                <p className="text-sm font-semibold text-slate-500">Personne en attente</p>
                                <p className="mt-1 text-xs text-slate-400">Les nouvelles arrivées apparaissent ici</p>
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        </section>
    );
}

// ── Sortie ───────────────────────────────────────────────────────────────
export function PorteSortie() {
    return (
        <Droppable droppableId={ID_SORTIE} renderClone={cloneCamion('liste')}>
            {(p, s) => (
                <div
                    ref={p.innerRef}
                    {...p.droppableProps}
                    className={`glass relative h-[92px] overflow-hidden rounded-3xl p-4 transition ${s.isDraggingOver ? 'scale-[1.02] ring-4 ring-rose-400/50' : ''}`}
                >
                    <div className={`barriere absolute left-0 right-0 top-0 h-2.5 opacity-80 ${s.isDraggingOver ? 'barriere-active' : ''}`} />
                    <div className="mt-2 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                            <DoorOpen size={20} />
                        </span>
                        <div>
                            <p className="text-sm font-extrabold text-slate-800">{s.isDraggingOver ? 'Relâchez pour la sortie' : 'Sortie du site'}</p>
                            <p className="text-xs text-slate-500">Glissez un camion ici quand il part</p>
                        </div>
                    </div>
                    <div className="h-0 overflow-hidden">{p.placeholder}</div>
                </div>
            )}
        </Droppable>
    );
}

// ── Quai : porte sectionnelle 3D ─────────────────────────────────────────
export function PorteQuai({ quai, occupant }: { quai: Quai; occupant?: Visite }) {
    const occupe = !!occupant;
    return (
        <div className="dock flex flex-col" data-occupe={occupe}>
            <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="truncate text-xs font-extrabold uppercase tracking-wider text-slate-700" title={quai.description ?? undefined}>
                    {quai.nom}
                </span>
                <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full shadow ${occupe ? 'voyant bg-rose-500 shadow-rose-500/60' : 'bg-emerald-500 shadow-emerald-500/60'}`}
                    title={occupe ? 'Occupé' : 'Libre'}
                />
            </div>
            <Droppable droppableId={idQuai(quai.id)} isDropDisabled={occupe} renderClone={cloneCamion('quai')}>
                {(p, s) => (
                    <div
                        className={`relative h-[172px] overflow-hidden rounded-2xl border transition ${
                            s.isDraggingOver
                                ? 'border-amber-400 bg-amber-100/60 shadow-[0_0_0_4px_rgba(251,191,36,0.25),0_20px_40px_-12px_rgba(245,158,11,0.45)]'
                                : occupe
                                  ? 'border-slate-300/60 bg-slate-800/[0.07]'
                                  : 'border-white/80 bg-white/40'
                        }`}
                    >
                        {/* Porte qui se lève quand un camion est à quai */}
                        <div className="dock-door pointer-events-none absolute inset-x-2 top-2 h-[120px] rounded-t-lg">
                            {!occupe && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 shadow-sm">
                                        {s.isDraggingOver ? 'Déposer' : 'Libre'}
                                    </span>
                                </span>
                            )}
                        </div>
                        <div className="dock-floor pointer-events-none absolute inset-x-0 bottom-0 h-10" />
                        <div className="pointer-events-none absolute inset-x-3 bottom-0 flex h-1.5 gap-1">
                            {Array.from({ length: 6 }, (_, i) => (
                                <span key={i} className={`flex-1 rounded-t ${i % 2 ? 'bg-slate-800/70' : 'bg-amber-400'}`} />
                            ))}
                        </div>
                        <div ref={p.innerRef} {...p.droppableProps} className="absolute inset-0 flex items-end justify-center px-1.5 pb-3">
                            {occupant && <CamionGlissable visite={occupant} index={0} variante="quai" />}
                            {p.placeholder}
                        </div>
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export function GrilleQuais({ quais, parQuai, entete }: { quais: Quai[]; parQuai: Map<string, Visite>; entete?: ReactNode }) {
    const libres = quais.filter((q) => !parQuai.has(q.id)).length;
    return (
        <section className="glass flex min-h-0 flex-col rounded-3xl p-4">
            <EnTete
                icone={<Warehouse size={15} />}
                titre="Quais"
                couleur="var(--quai)"
                droite={
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        {pluriel(libres, 'libre')} / {quais.length}
                    </span>
                }
            />
            {entete}
            <div className="scroll-fin grid flex-1 grid-cols-[repeat(auto-fill,minmax(112px,1fr))] content-start gap-3 overflow-y-auto pb-1 pr-1">
                {quais.map((q) => (
                    <PorteQuai key={q.id} quai={q} occupant={parQuai.get(q.id)} />
                ))}
            </div>
        </section>
    );
}

// ── Parkings ─────────────────────────────────────────────────────────────
export function ZoneParking({ parking, occupants }: { parking: Parking; occupants: Visite[] }) {
    const n = occupants.length;
    const plein = n >= parking.capacite;
    const taux = Math.min(100, (n / parking.capacite) * 100);
    return (
        <div className="rounded-2xl border border-white/70 bg-white/45 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-bold text-slate-800">{parking.nom}</p>
                <span className={`shrink-0 font-mono text-xs font-extrabold ${plein ? 'text-rose-600' : 'text-slate-500'}`}>
                    {n}/{parking.capacite}
                </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-900/5">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${plein ? 'bg-rose-500' : taux > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${taux}%` }}
                />
            </div>
            <Droppable droppableId={idParking(parking.id)} isDropDisabled={plein} renderClone={cloneCamion('parking')}>
                {(p, s) => (
                    <div
                        ref={p.innerRef}
                        {...p.droppableProps}
                        className={`mt-2.5 flex min-h-[52px] flex-col gap-2 rounded-xl p-1.5 transition ${
                            s.isDraggingOver ? 'bg-emerald-500/10 ring-2 ring-emerald-400' : 'bg-slate-900/[0.03]'
                        }`}
                        style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 46px, rgba(15,23,42,0.06) 46px 48px)',
                        }}
                    >
                        {occupants.map((v, i) => (
                            <CamionGlissable key={v.id} visite={v} index={i} variante="parking" />
                        ))}
                        {p.placeholder}
                        {n === 0 && !s.isDraggingOver && (
                            <p className="py-2.5 text-center text-xs font-medium text-slate-400">{pluriel(parking.capacite, 'place libre', 'places libres')}</p>
                        )}
                        {plein && <p className="text-center text-[11px] font-bold uppercase tracking-wider text-rose-500">Complet</p>}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export function ListeParkings({ parkings, parParking }: { parkings: Parking[]; parParking: Map<string, Visite[]> }) {
    const total = parkings.reduce((a, p) => a + p.capacite, 0);
    const occupes = parkings.reduce((a, p) => a + (parParking.get(p.id)?.length ?? 0), 0);
    return (
        <section className="glass flex min-h-0 flex-col rounded-3xl p-4">
            <EnTete
                icone={<ParkingSquare size={15} />}
                titre="Parkings"
                couleur="var(--parking)"
                droite={<span className="font-mono text-xs font-bold text-slate-500">{occupes}/{total}</span>}
            />
            <div className="scroll-fin flex-1 space-y-3 overflow-y-auto pr-1">
                {parkings.map((p) => (
                    <ZoneParking key={p.id} parking={p} occupants={parParking.get(p.id) ?? []} />
                ))}
                {parkings.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucun parking configuré</p>}
            </div>
        </section>
    );
}
