import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Coque from './components/Coque';
import TableauDeBord from './pages/TableauDeBord';
import Historique from './pages/Historique';
import Vehicules from './pages/Vehicules';
import Configuration from './pages/Configuration';
import Connexion from './pages/Connexion';
import { authApi } from './api/simba';
import { useAuth } from './store/useAuth';

export default function App() {
    const jeton = useAuth((s) => s.jeton);
    const utilisateur = useAuth((s) => s.utilisateur);

    // Session mémorisée : on vérifie qu'elle est toujours valide (sinon retour à la connexion).
    useEffect(() => {
        if (jeton && !utilisateur) {
            authApi.moi().then(useAuth.getState().setUtilisateur).catch(() => useAuth.getState().fermer());
        }
    }, [jeton, utilisateur]);

    if (!jeton) return <Connexion />;
    if (!utilisateur) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
            </div>
        );
    }

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Coque>
                <Routes>
                    <Route path="/" element={<TableauDeBord />} />
                    <Route path="/historique" element={<Historique />} />
                    <Route path="/vehicules" element={<Vehicules />} />
                    <Route path="/configuration" element={<Configuration />} />
                    {/* anciennes adresses */}
                    <Route path="/quais" element={<Navigate to="/configuration" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Coque>
        </BrowserRouter>
    );
}
