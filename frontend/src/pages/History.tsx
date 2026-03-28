import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatDatetime, formatDuree } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';
import { Search, Calendar, Filter, Truck, Layout } from 'lucide-react';
import Button from '../components/Button';

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
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase">History</h1>
                    <p className="text-[var(--text-secondary)] mt-1 font-medium italic opacity-60">Log of all vehicle movements and operations.</p>
                </div>
                
                <div className="flex bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border)] gap-6 shadow-sm">
                     <div className="px-2">
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] block mb-1">Records Found</span>
                        <span className="text-2xl font-black text-[var(--text-primary)] font-mono">{filteredHistory.length}</span>
                     </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border)] shadow-sm">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input 
                        className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl pl-12 pr-4 py-3 text-sm text-[var(--text-primary)] focus:border-amber-500 outline-none transition-all font-bold placeholder:opacity-30"
                        placeholder="Search matricule..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <select 
                        className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl pl-12 pr-4 py-3 text-sm text-[var(--text-primary)] focus:border-amber-500 outline-none appearance-none transition-all font-bold"
                        value={filterQuai}
                        onChange={e => setFilterQuai(e.target.value)}
                    >
                        <option value="">All Quais</option>
                        {uniqueQuais.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input 
                        type="date"
                        className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl pl-12 pr-4 py-3 text-sm text-[var(--text-primary)] focus:border-amber-500 outline-none transition-all font-bold [color-scheme:light]"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                </div>

                <Button 
                    variant="ghost"
                    onClick={() => {setSearchTerm(''); setFilterQuai(''); setFilterDate('');}}
                    className="h-full rounded-2xl border-2 border-[var(--border)]"
                >
                    Reset Filters
                </Button>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Vehicle</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Quai</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Arrival</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Departure</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">Operation Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredHistory.map((row) => (
                                <tr key={row.id} className="hover:bg-amber-50/[0.3] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-secondary)] border-2 border-[var(--border)] group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all shadow-sm">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <div className="font-mono font-black text-[var(--text-primary)] text-xl leading-none tracking-tight">{row.camion?.matricule || '???'}</div>
                                                <div className="text-[9px] font-black text-[var(--text-secondary)] uppercase mt-2 tracking-widest opacity-60">{row.camion?.transporteur || 'No Carrier'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-1.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-black text-[10px] border-2 border-[var(--border)] uppercase tracking-widest group-hover:border-amber-300 transition-colors">
                                            {row.quai?.nom || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-[var(--text-secondary)] font-bold">{formatDatetime(row.arrivee)}</td>
                                    <td className="px-8 py-6 text-sm text-[var(--text-secondary)] font-bold">{row.depart ? formatDatetime(row.depart) : '-'}</td>
                                    <td className="px-8 py-6 text-right">
                                        {row.dureeMinutes ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-emerald-500 font-mono font-black text-lg leading-none">{formatDuree(row.dureeMinutes)}</span>
                                                <span className="text-[8px] font-black uppercase text-emerald-500/50 mt-1 tracking-tighter">Completed</span>
                                            </div>
                                        ) : (
                                            <span className="text-[var(--text-secondary)] opacity-30 italic font-medium">In progress...</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredHistory.length === 0 && !loading && (
                    <div className="px-8 py-32 text-center bg-slate-50/30">
                        <div className="w-20 h-20 bg-[var(--bg-primary)] rounded-[32px] border-2 border-[var(--border)] border-dashed flex items-center justify-center mx-auto mb-6">
                            <Filter className="w-8 h-8 text-[var(--text-secondary)] opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">No Records Found</h3>
                        <p className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-[0.2em] opacity-40">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
