import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatDatetime, formatDuree } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';
import { Search, Calendar, Filter, Truck, Layout } from 'lucide-react';

export default function History() {
    const { historique, loading, fetchHistorique } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterQuai, setFilterQuai] = useState('');
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        fetchHistorique(200);
    }, [fetchHistorique]);

    const uniqueQuais = useMemo(() => {
        const names = historique.map(h => h.quai?.nom).filter(Boolean);
        return Array.from(new Set(names)) as string[];
    }, [historique]);

    const filteredHistory = useMemo(() => {
        return historique.filter(item => {
            const matchesSearch = item.camion?.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.quai?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesQuai = filterQuai === '' || item.quai?.nom === filterQuai;
            
            const matchesDate = filterDate === '' || (item.arrivee && isSameDay(parseISO(item.arrivee), parseISO(filterDate)));

            return matchesSearch && matchesQuai && matchesDate;
        });
    }, [historique, searchTerm, filterQuai, filterDate]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">HISTORIQUE</h1>
                    <p className="text-slate-400 mt-1">Archive des mouvements et chargements.</p>
                </div>
                
                <div className="flex bg-slate-900/50 p-2 rounded-2xl border border-slate-800 gap-4">
                     <div className="px-4 py-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase block">Total</span>
                        <span className="text-xl font-bold text-white">{filteredHistory.length}</span>
                     </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800/60 shadow-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-all"
                        placeholder="Rechercher matricule..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <Layout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none appearance-none transition-all"
                        value={filterQuai}
                        onChange={e => setFilterQuai(e.target.value)}
                    >
                        <option value="">Tous les quais</option>
                        {uniqueQuais.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="date"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-all [color-scheme:dark]"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                </div>

                <button 
                    onClick={() => {setSearchTerm(''); setFilterQuai(''); setFilterDate('');}}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all"
                >
                    Réinitialiser
                </button>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-800">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Véhicule</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Quai</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Arrivée</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Départ</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Temps d'opération</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredHistory.map((row) => (
                                <tr key={row.id} className="hover:bg-amber-500/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 group-hover:bg-amber-500/10 group-hover:text-amber-500 group-hover:border-amber-500/20 transition-all">
                                                <Truck size={18} />
                                            </div>
                                            <div>
                                                <div className="font-mono font-black text-white text-lg leading-none">{row.camion?.matricule || '???'}</div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">{row.camion?.transporteur || 'SANS TRANSPORT'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">
                                            {row.quai?.nom || 'Inconnu'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-400 font-medium">{formatDatetime(row.arrivee)}</td>
                                    <td className="px-6 py-5 text-sm text-slate-400 font-medium">{row.depart ? formatDatetime(row.depart) : '-'}</td>
                                    <td className="px-6 py-5 text-right font-mono font-bold text-white">
                                        {row.dureeMinutes ? (
                                            <span className="text-emerald-500">{formatDuree(row.dureeMinutes)}</span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredHistory.length === 0 && !loading && (
                    <div className="px-6 py-20 text-center">
                        <Filter className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Aucun résultat ne correspond à vos filtres.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
