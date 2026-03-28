import { NavLink } from 'react-router-dom';

export default function NavBar() {
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
        }`;

    return (
        <header className="bg-[var(--bg-card)] border-b border-[var(--border)] shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center
                          shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor"
                            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[var(--text-primary)] font-black text-xl tracking-tighter">SIMBA</span>
                        <span className="ml-2 text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-60">Operations</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-2">
                    <NavLink to="/" end className={linkClass}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/historique" className={linkClass}>
                        History
                    </NavLink>
                    <NavLink to="/quais" className={linkClass}>
                        Quais
                    </NavLink>
                    <NavLink to="/vehicules" className={linkClass}>
                        Véhicules
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}
