import { useEffect, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { History, LayoutDashboard, Plus, Settings2, Truck } from 'lucide-react';
import { useTempsReel } from '../hooks/useTempsReel';
import { useMaintenant } from '../hooks/useMaintenant';
import { useSite } from '../store/useSite';
import { useUi } from '../store/useUi';
import Bouton from './ui/Bouton';
import Notifications from './ui/Notifications';
import ModaleAccueil from './parcours/ModaleAccueil';
import FicheVisite from './parcours/FicheVisite';
import ModaleSortie from './parcours/ModaleSortie';

const LIENS = [
    { to: '/', libelle: 'Tableau de bord', icone: LayoutDashboard, fin: true },
    { to: '/historique', libelle: 'Historique', icone: History },
    { to: '/vehicules', libelle: 'Véhicules', icone: Truck },
    { to: '/configuration', libelle: 'Configuration', icone: Settings2 },
];

function Horloge() {
    const t = useMaintenant();
    const d = new Date(t);
    return (
        <span className="hidden font-mono text-sm font-bold tabular-nums text-slate-700 lg:inline">
            {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    );
}

function Connexion() {
    const connecte = useSite((s) => s.connecte);
    return (
        <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${connecte ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'}`}
            title={connecte ? 'Les écrans se mettent à jour en temps réel' : 'Connexion temps réel interrompue — rafraîchissement automatique toutes les 30 s'}
        >
            <span className={`h-2 w-2 rounded-full ${connecte ? 'voyant bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="hidden sm:inline">{connecte ? 'En direct' : 'Hors ligne'}</span>
        </span>
    );
}

/** Mise en page commune : fond animé, navigation, fenêtres globales. */
export default function Coque({ children }: { children: ReactNode }) {
    useTempsReel();
    const ouvrirAccueil = useUi((s) => s.ouvrirAccueil);

    // Raccourci clavier « N » : nouvelle arrivée
    useEffect(() => {
        const surTouche = (e: KeyboardEvent) => {
            const cible = e.target as HTMLElement;
            if (cible.closest('input, textarea, select, [contenteditable], [role="dialog"]')) return;
            if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                ouvrirAccueil();
            }
        };
        window.addEventListener('keydown', surTouche);
        return () => window.removeEventListener('keydown', surTouche);
    }, [ouvrirAccueil]);

    return (
        <div className="relative min-h-screen">
            <div className="aurora" aria-hidden>
                <span />
                <span />
                <span />
                <span />
            </div>

            <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
                <div className="glass mx-auto flex max-w-[1600px] items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4">
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30">
                            <Truck size={20} className="text-white" />
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                        </div>
                        <div className="hidden leading-tight sm:block">
                            <p className="text-lg font-black tracking-tight text-slate-900">SIMBA</p>
                            <p className="-mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Gestion du site</p>
                        </div>
                    </div>

                    <nav className="ml-1 flex flex-1 items-center gap-1 overflow-x-auto sm:ml-4">
                        {LIENS.map(({ to, libelle, icone: Icone, fin }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={fin}
                                title={libelle}
                                className={({ isActive }) =>
                                    `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                        isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                                    }`
                                }
                            >
                                <Icone size={16} />
                                <span className="hidden md:inline">{libelle}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Horloge />
                        <Connexion />
                        <Bouton onClick={() => ouvrirAccueil()} icone={<Plus size={18} />} title="Nouvelle arrivée (raccourci : N)" className="!px-3 sm:!px-4">
                            <span className="hidden sm:inline">Nouvelle arrivée</span>
                        </Bouton>
                    </div>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-[1600px] px-3 pb-10 pt-5 sm:px-5">{children}</main>

            <ModaleAccueil />
            <FicheVisite />
            <ModaleSortie />
            <Notifications />
        </div>
    );
}
