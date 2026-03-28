import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import ManageQuais from './pages/ManageQuais';
import Vehicules from './pages/Vehicules';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-amber-100">
                <NavBar />
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/historique" element={<History />} />
                        <Route path="/quais" element={<ManageQuais />} />
                        <Route path="/vehicules" element={<Vehicules />} />
                    </Routes>
                </main>

                <footer className="py-8 border-t border-[var(--border)] text-center text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest opacity-40">
                    &copy; {new Date().getFullYear()} Simba Logistics Hub. All rights reserved.
                </footer>
            </div>
        </Router>
    );
}

export default App;
