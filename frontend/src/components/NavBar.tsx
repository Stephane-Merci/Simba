import { NavLink } from 'react-router-dom';

export default function NavBar() {
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${isActive
            ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30'
            : 'text-slate-300 hover:text-white hover:bg-slate-700'
        }`;

    return (
        <header className="bg-slate-900 border-b border-slate-700/60 shadow-xl shadow-black/40 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center
                          shadow-lg shadow-amber-500/40">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor"
                            strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-white font-extrabold text-lg tracking-tight">SIMBA</span>
                        <span className="ml-2 text-xs text-slate-400 font-medium">Gestion des quais</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    <NavLink to="/" end className={linkClass}>
                        Tableau de bord
                    </NavLink>
                    <NavLink to="/historique" className={linkClass}>
                        Historique
                    </NavLink>
                    <NavLink to="/quais" className={linkClass}>
                        Gestion des quais
                    </NavLink>
                    <NavLink to="/vehicules" className={linkClass}>
                        Véhicules
                    </NavLink>

                </nav>
            </div>
        </header>
    );
}
