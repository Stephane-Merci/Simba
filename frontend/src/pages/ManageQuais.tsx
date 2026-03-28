import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import Button from '../components/Button';

export default function ManageQuais() {
    const { quais, fetchQuais, createQuai, updateQuai, deleteQuai } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nom: '', description: '' });

    useEffect(() => {
        fetchQuais();
    }, [fetchQuais]);

    const handleSave = async () => {
        if (!formData.nom) return;
        setIsLoading(true);
        try {
            if (editingId) {
                await updateQuai(editingId, formData.nom, formData.description);
            } else {
                await createQuai(formData.nom, formData.description);
            }
            reset();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce quai ?')) return;
        setIsLoading(true);
        try {
            await deleteQuai(id);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ nom: '', description: '' });
    };

    const startEdit = (quai: any) => {
        setEditingId(quai.id);
        setFormData({ nom: quai.nom, description: quai.description || '' });
        setIsAdding(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Configuration des Quais</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Gérez l'infrastructure de votre entrepôt.</p>
                </div>
                {!isAdding && (
                    <Button 
                        onClick={() => setIsAdding(true)}
                    >
                        + Ajouter un quai
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">{editingId ? 'Modifier le quai' : 'Nouveau quai'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Nom du quai</label>
                            <input 
                                className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-amber-500 transition-all"
                                value={formData.nom}
                                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                placeholder="ex: Quai A1"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Description</label>
                            <input 
                                className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] outline-none focus:border-amber-500 transition-all"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="ex: Zone Sud, Portes 1-4"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button 
                            variant="ghost" 
                            onClick={reset} 
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button 
                            onClick={handleSave}
                            isLoading={isLoading}
                        >
                            Enregistrer
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quais.map((quai) => (
                    <div key={quai.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 group hover:border-slate-300 transition-all shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{quai.nom}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{quai.description || 'Sans description'}</p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => startEdit(quai)}
                                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => handleDelete(quai.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)] opacity-60">
                            <span>Créé le {new Date(quai.createdAt).toLocaleDateString()}</span>
                            <span>ID: {quai.id.substring(0, 8)}...</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
