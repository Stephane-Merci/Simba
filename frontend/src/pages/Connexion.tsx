import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { authApi } from '../api/simba';
import { messageErreur } from '../api/client';
import { useAuth } from '../store/useAuth';
import Bouton from '../components/ui/Bouton';

/** Écran de connexion (pas d'inscription : les comptes sont créés côté serveur). */
export default function Connexion() {
    const ouvrir = useAuth((s) => s.ouvrir);
    const [identifiant, setIdentifiant] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [visible, setVisible] = useState(false);
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const valider = async (e: FormEvent) => {
        e.preventDefault();
        setEnvoi(true);
        setErreur(null);
        try {
            const r = await authApi.connexion(identifiant, motDePasse);
            ouvrir(r.jeton, r.utilisateur);
        } catch (err) {
            setErreur(messageErreur(err));
            setEnvoi(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
            <div className="w-full max-w-sm">
                <img src="/logo-tyt.png" alt="Groupe TYT" className="mx-auto mb-6 h-36 w-36 object-contain mix-blend-multiply" />
                <form onSubmit={valider} className="glass rounded-2xl p-6">
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Connexion</h1>
                    <p className="mb-5 mt-0.5 text-sm text-slate-500">SIMBA · Gestion du site</p>

                    <label className="label" htmlFor="identifiant">Identifiant</label>
                    <input
                        id="identifiant"
                        className="field mb-4"
                        autoComplete="username"
                        autoFocus
                        value={identifiant}
                        onChange={(e) => setIdentifiant(e.target.value)}
                    />

                    <label className="label" htmlFor="motDePasse">Mot de passe</label>
                    <div className="relative mb-4">
                        <input
                            id="motDePasse"
                            type={visible ? 'text' : 'password'}
                            className="field pr-11"
                            autoComplete="current-password"
                            value={motDePasse}
                            onChange={(e) => setMotDePasse(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setVisible((v) => !v)}
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700"
                            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </div>

                    {erreur && (
                        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">
                            {erreur}
                        </p>
                    )}

                    <Bouton
                        type="submit"
                        className="w-full"
                        chargement={envoi}
                        disabled={!identifiant.trim() || !motDePasse}
                        icone={<LogIn size={17} />}
                    >
                        Se connecter
                    </Bouton>
                </form>
            </div>
        </div>
    );
}
