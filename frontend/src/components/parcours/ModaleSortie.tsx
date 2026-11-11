import { useEffect, useState } from 'react';
import { DoorOpen } from 'lucide-react';
import { messageErreur } from '../../api/client';
import { duree, quand } from '../../lib/format';
import { dureeVisite } from '../../lib/parcours';
import { useMaintenant } from '../../hooks/useMaintenant';
import { useSite } from '../../store/useSite';
import { notifier, useUi } from '../../store/useUi';
import Modale from '../ui/Modale';
import Bouton from '../ui/Bouton';
import Plaque from '../ui/Plaque';
import BadgeOperation from '../ui/BadgeOperation';
import { BarreParcours, ChronologieSejours, RepartitionZones } from './Parcours';

/** Départ du camion : récapitulatif du passage puis désaffectation. */
export default function ModaleSortie() {
    const id = useUi((s) => s.sortieVisite);
    const fermer = useUi((s) => s.fermerSortie);
    const fermerFiche = useUi((s) => s.fermerVisite);
    const visite = useSite((s) => s.etat?.visites.find((v) => v.id === id));
    const sortie = useSite((s) => s.sortie);
    const maintenant = useMaintenant();
    const [notes, setNotes] = useState('');
    const [envoi, setEnvoi] = useState(false);

    useEffect(() => setNotes(visite?.notes ?? ''), [id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!visite) return null;

    const valider = async () => {
        setEnvoi(true);
        try {
            const v = await sortie(visite.id, notes);
            notifier({
                type: 'succes',
                titre: `${v.camion.matricule} a quitté le site`,
                message: `Temps total sur site : ${duree(dureeVisite(v, Date.now()))}`,
            });
            fermer();
            fermerFiche();
        } catch (e) {
            notifier({ type: 'erreur', titre: 'Sortie impossible', message: messageErreur(e) });
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <Modale
            ouvert={!!id}
            onFermer={fermer}
            titre="Enregistrer la sortie"
            sousTitre="Vérifiez le récapitulatif avant de libérer le camion"
            largeur="max-w-xl"
            pied={
                <>
                    <Bouton variante="fantome" onClick={fermer}>
                        Annuler
                    </Bouton>
                    <Bouton variante="danger" taille="lg" icone={<DoorOpen size={18} />} onClick={valider} chargement={envoi} autoFocus>
                        Valider la sortie
                    </Bouton>
                </>
            }
        >
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/60 p-4">
                    <div className="space-y-1.5">
                        <Plaque matricule={visite.camion.matricule} taille="lg" />
                        <div className="flex items-center gap-2">
                            <BadgeOperation operation={visite.operation} />
                            {visite.camion.transporteur && <span className="text-xs text-slate-500">{visite.camion.transporteur}</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Temps sur site</p>
                        <p className="font-mono text-3xl font-black text-slate-900">{duree(dureeVisite(visite, maintenant))}</p>
                        <p className="text-xs text-slate-500">arrivé à {quand(visite.arrivee, maintenant)}</p>
                    </div>
                </div>
                <BarreParcours sejours={visite.sejours} maintenant={maintenant} hauteur="h-3" />
                <RepartitionZones sejours={visite.sejours} maintenant={maintenant} />
                <ChronologieSejours sejours={visite.sejours} maintenant={maintenant} />
                <div>
                    <label className="label" htmlFor="notes-sortie">Note de sortie</label>
                    <textarea id="notes-sortie" rows={2} className="field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bon de livraison, réserve… (facultatif)" />
                </div>
            </div>
        </Modale>
    );
}
