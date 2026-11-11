import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Coque from './components/Coque';
import TableauDeBord from './pages/TableauDeBord';
import Historique from './pages/Historique';
import Vehicules from './pages/Vehicules';
import Configuration from './pages/Configuration';

export default function App() {
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
