import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import Truck from '../components/Truck';

export default function Vehicules() {
    const { camions, fetchCamions, createCamion, updateCamion, deleteCamion } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ matricule: '', transporteur: '' });

    useEffect(() => {
        fetchCamions();
    }, [fetchCamions]);

    const handleSave = async () => {
        if (!formData.matricule) return;
        if (editingId) {
            await updateCamion(editingId, formData.matricule, formData.transporteur);
        } else {
            await createCamion(formData.matricule, formData.transporteur);
        }
        reset();
    };

    const reset = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ matricule: '', transporteur: '' });
    };

    const startEdit = (camion: any) => {
        setEditingId(camion.id);
        setFormData({ matricule: camion.matricule, transporteur: camion.transporteur || '' });
        setIsAdding(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gestion des Véhicules</h1>
                    <p className="text-slate-400 mt-1">Gérez la flotte de camions entrant dans l'entrepôt.</p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-amber-500 text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                    >
                        + Nouveau véhicule
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                    <h2 className="text-lg font-bold text-white mb-4">{editingId ? 'Modifier véhicule' : 'Nouveau véhicule'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Matricule</label>
                            <input 
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500 transition-all font-mono"
                                value={formData.matricule}
                                onChange={e => setFormData({ ...formData, matricule: e.target.value.toUpperCase() })}
                                placeholder="ex: ABC-123-XY"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Transporteur / Transporteur</label>
                            <input 
                                className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500 transition-all"
                                value={formData.transporteur}
                                onChange={e => setFormData({ ...formData, transporteur: e.target.value })}
                                placeholder="ex: DHL, FedEx..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={reset} className="px-5 py-2.5 text-slate-400 hover:text-white font-medium">
                            Annuler
                        </button>
                        <button 
                            onClick={handleSave}
                            className="bg-slate-100 text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-white active:scale-[0.98] transition-all"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {camions.map((camion) => (
                    <div key={camion.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 group hover:border-slate-700 transition-all flex flex-col items-center">
                        <Truck 
                            matricule={camion.matricule} 
                            color={camion.status === 'A_QUAI' ? '#f59e0b' : camion.status === 'PARTI' ? '#475569' : '#fff'}
                            className="mb-6 scale-90"
                        />
                        
                        <div className="w-full flex justify-between items-start pt-4 border-t border-white/5">
                            <div>
                                <h3 className="text-lg font-bold text-white font-mono">{camion.matricule}</h3>
                                <p className="text-sm text-slate-500">{camion.transporteur || 'Sans transporteur'}</p>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                ${camion.status === 'A_QUAI' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                  camion.status === 'PARKING' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                  'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                                {camion.status}
                            </div>
                        </div>

                        <div className="w-full flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => startEdit(camion)}
                                className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                            >
                                Modifier
                            </button>
                            <button 
                                onClick={() => confirm('Supprimer ce véhicule ?') && deleteCamion(camion.id)}
                                className="flex-1 py-2 text-xs font-bold text-slate-400 hover:text-red-500 bg-slate-800 rounded-lg"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {camions.length === 0 && !isAdding && (
                <div className="text-center py-20 bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-800">
                    <p className="text-slate-500">Aucun véhicule enregistré.</p>
                </div>
            )}
        </div>
    );
}
