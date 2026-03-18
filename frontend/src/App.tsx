import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import ManageQuais from './pages/ManageQuais';
import Vehicules from './pages/Vehicules';

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
                <NavBar />
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/historique" element={<History />} />
                        <Route path="/quais" element={<ManageQuais />} />
                        <Route path="/vehicules" element={<Vehicules />} />
                    </Routes>
                </main>

                <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} Simba - Gestion Logistique. Tous droits réservés.
                </footer>
            </div>
        </Router>
    );
}

export default App;
