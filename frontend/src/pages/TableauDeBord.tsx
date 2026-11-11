import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { AlertTriangle, Clock, LogOut, MapPin, ParkingSquare, Truck, Warehouse } from 'lucide-react';
import { useSite } from '../store/useSite';
import { useUi } from '../store/useUi';
import { useMaintenant } from '../hooks/useMaintenant';
import { useTilt } from '../hooks/useTilt';
import { ID_SORTIE, destinationDepuisId, niveauSejour, occupation, sejourActuel } from '../lib/parcours';
import { dureeMinutes } from '../lib/format';
import { FileAttente, GrilleQuais, ListeParkings, PorteSortie } from '../components/site/Zones';
import Bouton from '../components/ui/Bouton';

function Indicateur({ icone, libelle, valeur, detail, couleur }: { icone: ReactNode; libelle: string; valeur: ReactNode; detail?: ReactNode; couleur: string }) {
    const tilt = useTilt(9);
    return (
        <div {...tilt} className="tilt glass relative overflow-hidden rounded-2xl px-4 py-3">
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-25 blur-xl" style={{ background: couleur }} />
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span style={{ color: couleur }}>{icone}</span>
                {libelle}
            </div>
            <div className="tilt-pop mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-black text-slate-900">{valeur}</span>
                {detail && <span className="text-xs font-semibold text-slate-500">{detail}</span>}
            </div>
        </div>
    );
}

export default function TableauDeBord() {
    const etat = useSite((s) => s.etat);
    const stats = useSite((s) => s.stats);
    const erreur = useSite((s) => s.erreurChargement);
    const charger = useSite((s) => s.charger);
    const deplacer = useSite((s) => s.deplacer);
    const ouvrirSortie = useUi((s) => s.ouvrirSortie);
    const ouvrirAccueil = useUi((s) => s.ouvrirAccueil);
    const maintenant = useMaintenant();

    const occ = useMemo(() => (etat ? occupation(etat) : null), [etat]);

    if (!etat || !occ) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                {erreur ? (
                    <>
                        <p className="text-lg font-bold text-slate-800">Impossible de charger le site</p>
                        <p className="text-sm text-slate-500">{erreur}</p>
                        <Bouton onClick={() => charger()}>Réessayer</Bouton>
                    </>
                ) : (
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
                )}
            </div>
        );
    }

    const surDepot = (r: DropResult) => {
        if (!r.destination || r.destination.droppableId === r.source.droppableId) return;
        if (r.destination.droppableId === ID_SORTIE) {
            ouvrirSortie(r.draggableId);
            return;
        }
        const d = destinationDepuisId(r.destination.droppableId);
        if (d) void deplacer(r.draggableId, d);
    };

    const placesParking = etat.parkings.reduce((a, p) => a + p.capacite, 0);
    const auParking = [...occ.parParking.values()].reduce((a, l) => a + l.length, 0);
    const alertes = etat.visites.filter((v) => niveauSejour(sejourActuel(v), maintenant) === 'alerte').length;

    return (
        <DragDropContext onDragEnd={surDepot}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" style={{ perspective: 1000 }}>
                    <Indicateur icone={<Truck size={14} />} libelle="Sur site" valeur={etat.visites.length} detail={stats ? `${stats.arriveesDuJour} arrivées auj.` : undefined} couleur="#0ea5e9" />
                    <Indicateur icone={<MapPin size={14} />} libelle="À l'accueil" valeur={occ.attente.length} couleur="var(--attente)" />
                    <Indicateur icone={<Warehouse size={14} />} libelle="Quais occupés" valeur={occ.parQuai.size} detail={`/ ${etat.quais.length}`} couleur="var(--quai)" />
                    <Indicateur icone={<ParkingSquare size={14} />} libelle="Parking" valeur={auParking} detail={`/ ${placesParking} places`} couleur="var(--parking)" />
                    <Indicateur icone={<LogOut size={14} />} libelle="Sorties du jour" valeur={stats?.sortiesDuJour ?? '—'} couleur="#f43f5e" />
                    {alertes > 0 ? (
                        <Indicateur icone={<AlertTriangle size={14} />} libelle="Attentes longues" valeur={alertes} detail="à traiter" couleur="#ef4444" />
                    ) : (
                        <Indicateur
                            icone={<Clock size={14} />}
                            libelle="Durée moyenne"
                            valeur={stats?.moyenneVisiteMinutes ? dureeMinutes(stats.moyenneVisiteMinutes) : '—'}
                            detail="30 j"
                            couleur="#8b5cf6"
                        />
                    )}
                </div>

                <p className="hidden text-center text-xs text-slate-500 md:block">
                    Glissez-déposez un camion pour le déplacer entre l'accueil, les quais et les parkings · cliquez dessus pour ouvrir sa fiche ·
                    raccourci <kbd className="rounded border border-slate-300 bg-white/70 px-1.5 font-mono text-[10px]">N</kbd> pour une nouvelle arrivée
                </p>

                <div className="grid gap-4 lg:h-[calc(100vh-250px)] lg:min-h-[560px] lg:grid-cols-[300px_minmax(0,1fr)_300px]">
                    <div className="flex min-h-0 flex-col gap-4">
                        <FileAttente visites={occ.attente} />
                        <PorteSortie />
                    </div>

                    <GrilleQuais
                        quais={etat.quais}
                        parQuai={occ.parQuai}
                        entete={
                            etat.quais.length === 0 && (
                                <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
                                    <p className="font-semibold text-slate-600">Aucun quai configuré</p>
                                    <Link to="/configuration" className="mt-2 inline-block text-sm font-bold text-sky-600 hover:underline">
                                        Ajouter des quais →
                                    </Link>
                                </div>
                            )
                        }
                    />

                    <ListeParkings parkings={etat.parkings} parParking={occ.parParking} />
                </div>

                {etat.visites.length === 0 && (
                    <div className="flex justify-center">
                        <Bouton taille="lg" onClick={() => ouvrirAccueil()}>
                            Enregistrer la première arrivée
                        </Bouton>
                    </div>
                )}
            </div>
        </DragDropContext>
    );
}
