import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { authApi } from '../api/simba';
import { messageErreur } from '../api/client';
import { useAuth } from '../store/useAuth';
import { notifier } from '../store/useUi';
import Modale from './ui/Modale';
import Bouton from './ui/Bouton';

/** Changement du mot de passe de l'utilisateur connecté. */
export default function ModaleMotDePasse({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
    const ouvrir = useAuth((s) => s.ouvrir);
    const [actuel, setActuel] = useState('');
    const [nouveau, setNouveau] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const fermer = () => {
        setActuel('');
        setNouveau('');
        setConfirmation('');
        setErreur(null);
        onFermer();
    };

    const valider = async (e?: FormEvent) => {
        e?.preventDefault();
        if (nouveau.length < 8) return setErreur('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        if (nouveau !== confirmation) return setErreur('Les deux nouveaux mots de passe ne correspondent pas.');
        setEnvoi(true);
        setErreur(null);
        try {
            const { jeton } = await authApi.changerMotDePasse(actuel, nouveau);
            ouvrir(jeton);
            notifier({ type: 'succes', titre: 'Mot de passe modifié', message: 'Les autres sessions ont été déconnectées.' });
            fermer();
        } catch (err) {
            setErreur(messageErreur(err));
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <Modale
            ouvert={ouvert}
            onFermer={fermer}
            titre="Modifier le mot de passe"
            sousTitre="8 caractères minimum"
            largeur="max-w-md"
            pied={
                <>
                    <Bouton variante="secondaire" onClick={fermer}>Annuler</Bouton>
                    <Bouton onClick={() => valider()} chargement={envoi} disabled={!actuel || !nouveau || !confirmation} icone={<KeyRound size={16} />}>
                        Enregistrer
                    </Bouton>
                </>
            }
        >
            <form onSubmit={valider} className="space-y-4">
                {/* champ caché pour les gestionnaires de mots de passe */}
                <input type="text" autoComplete="username" value={useAuth.getState().utilisateur?.identifiant ?? ''} readOnly hidden />
                <div>
                    <label className="label" htmlFor="mdp-actuel">Mot de passe actuel</label>
                    <input id="mdp-actuel" type="password" className="field" autoComplete="current-password" autoFocus value={actuel} onChange={(e) => setActuel(e.target.value)} />
                </div>
                <div>
                    <label className="label" htmlFor="mdp-nouveau">Nouveau mot de passe</label>
                    <input id="mdp-nouveau" type="password" className="field" autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
                </div>
                <div>
                    <label className="label" htmlFor="mdp-confirmation">Confirmer le nouveau mot de passe</label>
                    <input id="mdp-confirmation" type="password" className="field" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
                </div>
                {erreur && (
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">{erreur}</p>
                )}
                <button type="submit" hidden />
            </form>
        </Modale>
    );
}
