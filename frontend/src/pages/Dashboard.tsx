import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getActiveAssignment, formatElapsed } from '../types';
import Truck from '../components/Truck';
import Button from '../components/Button';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Truck as TruckIcon, Info, Warehouse, ArrowRight, Timer, Plus, Minus } from 'lucide-react';

// Sub-component for a live ticking truck info (VERTICAL REFINED VERSION)
function QuaiCamion({ assignment, onLiberer }: { assignment: any, onLiberer: () => Promise<void> }) {
    const [elapsed, setElapsed] = useState('--:--:--');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const tick = () => {
            setElapsed(formatElapsed(assignment.arrivee));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [assignment.arrivee]);

    const handleRelease = async () => {
        setIsLoading(true);
        try {
            await onLiberer();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-between py-1 group/camion relative h-full">
            {/* Truck in Middle - Vertical */}
            <div className={`flex-1 flex items-center justify-center -my-3 transition-opacity ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
                <Truck 
                    orientation="vertical" 
                    color="#f8fafc"
                    matricule={assignment.camion?.matricule}
                    className="scale-[0.85] transition-transform group-hover/camion:scale-[0.88]"
                />
            </div>
            
            {/* Time Below */}
            <div className="text-[8px] font-black font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-0.5 rounded shadow-sm border border-[var(--border)]">
                {elapsed}
            </div>

            {/* Hidden button until hover */}
            <button 
                onClick={handleRelease}
                disabled={isLoading}
                className={`absolute top-1/2 -right-1 -translate-y-1/2 bg-red-600 text-white p-1 rounded-full shadow-lg transition-all hover:scale-110 z-30
                    ${isLoading ? 'opacity-100 pointer-events-none' : 'opacity-0 group-hover/camion:opacity-100'}`}
                title="Libérer"
            >
                {isLoading ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <ArrowRight size={10} />
                )}
            </button>
        </div>
    );
}

export default function Dashboard() {
    const { 
        quais, 
        parkingSections, 
        camions, 
        fetchQuais, 
        fetchParkingSections, 
        fetchCamions, 
        assignerCamion, 
        deplacerAuParking,
        renvoyerAEntree,
        libererQuai,
        createParkingSection,
        deleteParkingSection
    } = useStore();
    
    // UI States for Modals/Popups
    const [showParkingModal, setShowParkingModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newParkingName, setNewParkingName] = useState('');
    const [newParkingCap, setNewParkingCap] = useState(10);
    const [parkingFullSection, setParkingFullSection] = useState<string | null>(null);

    useEffect(() => {
        fetchQuais();
        fetchParkingSections();
        fetchCamions();
        const interval = setInterval(() => {
            fetchQuais();
            fetchParkingSections();
            fetchCamions();
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchQuais, fetchParkingSections, fetchCamions]);

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const destId = result.destination.droppableId;
        const camionId = result.draggableId;

        if (destId.startsWith('quai-')) {
            const quaiId = destId.replace('quai-', '');
            await assignerCamion(quaiId, camionId);
        } else if (destId.startsWith('parking-')) {
            const sectionId = destId.replace('parking-', '');
            const section = parkingSections.find(s => s.id === sectionId);
            const isAlreadyThere = camions.find(c => c.id === camionId)?.parkingSectionId === sectionId;
            
            if (!isAlreadyThere && section && (section.camions?.length || 0) >= section.capacite) {
                setParkingFullSection(section.nom);
                setTimeout(() => setParkingFullSection(null), 3000);
                return;
            }
            
            await deplacerAuParking(camionId, sectionId);
        } else if (destId === 'arrivals') {
            await renvoyerAEntree(camionId);
        }
    };

    const handleAddParking = () => {
        setNewParkingName('');
        setNewParkingCap(10);
        setShowParkingModal(true);
    };

    const submitNewParking = async () => {
        if (!newParkingName.trim()) return;
        setIsLoading(true);
        try {
            await createParkingSection(newParkingName, newParkingCap);
            setShowParkingModal(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteParking = async (id: string, name: string) => {
        if (!confirm(`Effacer la zone ${name} ?`)) return;
        setIsLoading(true);
        try {
            await deleteParkingSection(id);
        } finally {
            setIsLoading(false);
        }
    };

    const arrivees = camions.filter(c => c.status === 'PARTI');
    const totalParked = camions.filter(c => c.status === 'PARKING').length;
    
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="h-[calc(100vh-120px)] flex flex-col gap-4 animate-in fade-in duration-500 overflow-hidden">
                {/* Header - Compact */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Warehouse className="text-white" size={20} />
                         </div>
                         <div>
                            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter leading-none">SIMBA LIVE</h1>
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Warehouse Monitor</p>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-6 px-6 py-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] font-mono shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">En Attente: {arrivees.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Parking: {totalParked}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
                    
                    {/* MAIN (Col 10): ARRIVALS & DOCKS */}
                    <div className="col-span-10 flex flex-col gap-3 min-h-0">
                        
                        {/* TOP: Arrivals */}
                        <Droppable droppableId="arrivals" direction="horizontal">
                            {(provided, snapshot) => (
                                <div 
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`bg-[var(--bg-card)] rounded-2xl border-2 p-2.5 min-h-[70px] flex items-center gap-2 transition-all overflow-x-auto custom-scrollbar-mini shadow-sm
                                        ${snapshot.isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-[var(--border)]'}`}
                                >
                                    {arrivees.map((camion, index) => (
                                        <Draggable key={camion.id} draggableId={camion.id} index={index}>
                                            {(p, s) => (
                                                <div
                                                    ref={p.innerRef}
                                                    {...p.draggableProps}
                                                    {...p.dragHandleProps}
                                                    className={`shrink-0 w-18 h-10 rounded-xl border flex flex-col items-center justify-center transition-all shadow-sm
                                                        ${s.isDragging ? 'bg-blue-600 border-blue-400 z-50 scale-110 shadow-xl' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                                >
                                                    <Truck matricule={camion.matricule} color="#f8fafc" className="scale-[0.22] -my-5" />
                                                    <span className="text-[7.5px] font-black font-mono text-slate-100 truncate w-full text-center px-1">{camion.matricule}</span>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {arrivees.length === 0 && (
                                        <div className="w-full text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-40">
                                            Aucune arrivée
                                        </div>
                                    )}
                                </div>
                            )}
                        </Droppable>

                        {/* BOTTOM: QUAI ZONE (Grid of vertical slots) */}
                        <div className="flex-1 bg-[var(--bg-card)] rounded-3xl p-4 shadow-xl border border-[var(--border)] flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-4 px-1 border-b border-[var(--border)] pb-2">
                                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Quais de Déchargement</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase">Système Connecté</span>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 xxl:grid-cols-12 gap-3 overflow-y-auto pr-1 custom-scrollbar content-start">
                                {quais.map((quai, index) => {
                                    const active = getActiveAssignment(quai);
                                    return (
                                        <Droppable key={quai.id} droppableId={`quai-${quai.id}`} isDropDisabled={!!active}>
                                            {(p, s) => (
                                                <div ref={p.innerRef} {...p.droppableProps} className="flex flex-col gap-1.5 min-w-[70px]">
                                                    {/* Quai Name on Bottom */}
                                                    <div className={`h-[150px] rounded-2xl border-2 flex flex-col transition-all relative shadow-sm
                                                        ${active 
                                                            ? 'bg-slate-800 border-slate-700' 
                                                            : s.isDraggingOver 
                                                                ? 'bg-amber-50 border-amber-500 scale-[1.05] shadow-lg z-10' 
                                                                : 'bg-[var(--bg-primary)] border-[var(--border)] border-dashed'
                                                        }`}
                                                    >
                                                        {active ? (
                                                            <QuaiCamion 
                                                                assignment={active} 
                                                                onLiberer={() => libererQuai(active.id)} 
                                                            />
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-center text-[8px] font-black text-[var(--text-secondary)] opacity-10 uppercase tracking-[0.2em] rotate-90 whitespace-nowrap">
                                                                DISPONIBLE
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-center px-1">
                                                        <span className="text-[9px] font-black text-[var(--text-primary)] truncate uppercase tracking-tighter">{quai.nom}</span>
                                                    </div>
                                                    {p.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PARKING (Vertical) */}
                    <div className="col-span-2 flex flex-col gap-3 min-h-0 bg-[var(--bg-primary)] rounded-3xl p-4 border border-[var(--border)] shadow-inner">
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]/50">
                            <div className="flex items-center gap-2 text-[var(--text-primary)]">
                                 <TruckIcon size={14} className="text-amber-500" />
                                 <h2 className="text-[10px] font-black uppercase tracking-widest">Parking</h2>
                            </div>
                            <button 
                                onClick={handleAddParking} 
                                className="w-6 h-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar-mini pr-1">
                            {parkingSections.map(section => (
                                <div key={section.id} className="flex flex-col gap-1.5 group/sec bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border)] shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">{section.nom}</span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="flex-1 h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all ${section.camions?.length >= section.capacite ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, ((section.camions?.length || 0) / section.capacite) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-[8px] font-black ${section.camions?.length >= section.capacite ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                                                    {section.camions?.length || 0}/{section.capacite}
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteParking(section.id, section.nom)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover/sec:opacity-100 transition-all shadow-sm"
                                        >
                                            <Minus size={12} />
                                        </button>
                                    </div>
                                    <Droppable droppableId={`parking-${section.id}`}>
                                        {(p, s) => (
                                            <div 
                                                ref={p.innerRef} {...p.droppableProps}
                                                className={`min-h-[80px] flex flex-wrap content-start gap-1 p-2 rounded-xl border-2 border-dashed transition-all
                                                    ${s.isDraggingOver ? 'border-amber-400 bg-amber-50/30' : 'border-[var(--border)] bg-[var(--bg-primary)]/50'}`}
                                            >
                                                {(section.camions || []).map((camion, i) => (
                                                    <Draggable key={camion.id} draggableId={camion.id} index={i}>
                                                        {(p_c, s_c) => (
                                                            <div 
                                                                ref={p_c.innerRef} {...p_c.draggableProps} {...p_c.dragHandleProps}
                                                                className={`w-[48%] h-9 rounded-lg border flex flex-col items-center justify-center shadow-sm transition-all
                                                                    ${s_c.isDragging ? 'bg-amber-600 border-amber-400 z-50 scale-110 shadow-xl' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                                            >
                                                                <Truck matricule={camion.matricule} color="#f8fafc" className="scale-[0.28] -my-4" />
                                                                <span className="text-[7.5px] font-black font-mono text-slate-100 truncate px-1">
                                                                    {camion.matricule}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {p.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Parking Full Popup */}
            {parkingFullSection && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-[24px] shadow-2xl z-[100] animate-in slide-in-from-bottom-8 flex items-center gap-4 border-4 border-white/20">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Info className="animate-bounce" size={20} />
                    </div>
                    <div>
                        <p className="font-black text-sm uppercase tracking-[0.1em]">Parking Complet</p>
                        <p className="text-xs font-bold opacity-90">{parkingFullSection} est arrivé à sa capacité maximale.</p>
                    </div>
                </div>
            )}

            {/* Modal Adding Parking */}
            {showParkingModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-md rounded-[40px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="w-20 h-20 bg-amber-500 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-amber-500/30">
                                <Warehouse className="text-white" size={36} />
                            </div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-3 tracking-tighter">Nouvelle Zone</h2>
                            <p className="text-[var(--text-secondary)] text-sm mb-10 font-bold uppercase tracking-widest opacity-60">Aire de stationnement</p>
                            
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-3 block">Nom de la zone</label>
                                    <input 
                                        autoFocus
                                        value={newParkingName}
                                        onChange={e => setNewParkingName(e.target.value)}
                                        placeholder="Ex: Parking Nord, Attente A..."
                                        className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl px-6 py-5 text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-all font-black placeholder:text-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-4 block">Capacité maximale</label>
                                    <div className="flex items-center gap-6 bg-[var(--bg-primary)] p-2 rounded-3xl border-2 border-[var(--border)]">
                                        <button onClick={() => setNewParkingCap(Math.max(1, newParkingCap - 1))} className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-primary)] hover:bg-slate-100 transition-all border border-[var(--border)] shadow-sm active:scale-95"><Minus size={20} /></button>
                                        <div className="flex-1 text-center text-4xl font-black text-[var(--text-primary)] font-mono tracking-tighter">{newParkingCap}</div>
                                        <button onClick={() => setNewParkingCap(newParkingCap + 1)} className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-primary)] hover:bg-slate-100 transition-all border border-[var(--border)] shadow-sm active:scale-95"><Plus size={20} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-slate-50 flex gap-4">
                            <Button 
                                variant="ghost"
                                onClick={() => setShowParkingModal(false)}
                                className="flex-1 py-5 rounded-[24px]"
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                            <Button 
                                onClick={submitNewParking}
                                className="flex-[2] py-5 rounded-[24px]"
                                isLoading={isLoading}
                            >
                                Créer la zone
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DragDropContext>
    );
}
