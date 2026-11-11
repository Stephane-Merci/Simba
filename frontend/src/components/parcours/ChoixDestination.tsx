import { MapPin, ParkingSquare, Warehouse } from 'lucide-react';
import { occupation } from '../../lib/parcours';
import type { Destination, EtatSite } from '../../types';

interface Props {
    etat: EtatSite;
    /** Destination sélectionnée (mode formulaire) ou emplacement actuel (mode déplacement). */
    valeur: Destination | null;
    onChoisir: (d: Destination) => void;
    /** Visite à déplacer : son propre emplacement n'est pas compté comme occupé. */
    visiteId?: string;
    desactive?: boolean;
}

const egal = (a: Destination | null, b: Destination) =>
    !!a &&
    a.zone === b.zone &&
    (a.zone !== 'QUAI' || (b.zone === 'QUAI' && a.quaiId === b.quaiId)) &&
    (a.zone !== 'PARKING' || (b.zone === 'PARKING' && a.parkingSectionId === b.parkingSectionId));

/** Sélecteur d'emplacement : accueil, quais libres, parkings avec places. */
export default function ChoixDestination({ etat, valeur, onChoisir, visiteId, desactive }: Props) {
    const { parQuai, parParking } = occupation(etat);

    const classe = (actif: boolean, couleur: string) =>
        `chip ${actif ? 'text-white border-transparent shadow-lg' : 'bg-white/60 border-slate-200/80 text-slate-700 hover:bg-white'}` +
        (actif ? ` ${couleur}` : '');

    return (
        <div className="space-y-3">
            <div>
                <p className="label">Accueil</p>
                <button
                    type="button"
                    disabled={desactive}
                    onClick={() => onChoisir({ zone: 'ATTENTE' })}
                    className={classe(egal(valeur, { zone: 'ATTENTE' }), 'bg-violet-500 shadow-violet-500/30')}
                >
                    <MapPin size={15} /> File d'attente
                </button>
            </div>

            {etat.quais.length > 0 && (
                <div>
                    <p className="label">Quais</p>
                    <div className="flex flex-wrap gap-2">
                        {etat.quais.map((q) => {
                            const occupant = parQuai.get(q.id);
                            const occupe = !!occupant && occupant.id !== visiteId;
                            const d: Destination = { zone: 'QUAI', quaiId: q.id };
                            return (
                                <button
                                    key={q.id}
                                    type="button"
                                    disabled={desactive || occupe}
                                    onClick={() => onChoisir(d)}
                                    title={occupe ? `Occupé par ${occupant!.camion.matricule}` : 'Libre'}
                                    className={classe(egal(valeur, d), 'bg-orange-500 shadow-orange-500/30')}
                                >
                                    <Warehouse size={15} />
                                    {q.nom}
                                    {occupe && <span className="font-mono text-[10px] opacity-70">{occupant!.camion.matricule}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {etat.parkings.length > 0 && (
                <div>
                    <p className="label">Parkings</p>
                    <div className="flex flex-wrap gap-2">
                        {etat.parkings.map((p) => {
                            const presents = (parParking.get(p.id) ?? []).filter((v) => v.id !== visiteId).length;
                            const plein = presents >= p.capacite;
                            const d: Destination = { zone: 'PARKING', parkingSectionId: p.id };
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    disabled={desactive || plein}
                                    onClick={() => onChoisir(d)}
                                    className={classe(egal(valeur, d), 'bg-emerald-500 shadow-emerald-500/30')}
                                >
                                    <ParkingSquare size={15} />
                                    {p.nom}
                                    <span className="font-mono text-[11px] opacity-70">
                                        {plein ? 'complet' : `${p.capacite - presents} pl.`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
