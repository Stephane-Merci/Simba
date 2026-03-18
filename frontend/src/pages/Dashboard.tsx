import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getActiveAssignment, formatElapsed } from '../types';
import Truck from '../components/Truck';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Truck as TruckIcon, Info, Warehouse, ArrowRight, Timer } from 'lucide-react';

// Sub-component for a live ticking truck info
function QuaiCamion({ assignment, onLiberer }: { assignment: any, onLiberer: () => void }) {
    const [elapsed, setElapsed] = useState('--:--:--');

    useEffect(() => {
        const tick = () => {
            setElapsed(formatElapsed(assignment.arrivee));
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [assignment.arrivee]);

    return (
        <div className="group relative flex flex-col items-center">
            {/* Top Label (Time above car) as requested */}
            <div className="mb-2 flex flex-col items-center pointer-events-none z-20">
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-[4px] text-[9px] font-black font-mono shadow-lg flex items-center gap-1">
                    {elapsed}
                </span>
            </div>

            <Truck 
                orientation="vertical" 
                color="#F59E0B"
                matricule={assignment.camion?.matricule}
                className="animate-in slide-in-from-top-4 duration-500 scale-90"
            />

            
            {/* Quick Liberer Button (Visible on hover) */}

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all z-20">
                <button 
                    onClick={onLiberer}
                    className="bg-white text-slate-950 px-3 py-1.5 rounded-xl font-black text-[9px] shadow-2xl flex items-center gap-2 hover:bg-slate-200"
                >
                    LIBÉRER <ArrowRight size={10} />
                </button>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { quais, camions, loading, error, fetchQuais, fetchCamions, assignerCamion, libererQuai } = useStore();

    useEffect(() => {
        fetchQuais();
        fetchCamions('PARKING');
        const interval = setInterval(() => {
            fetchQuais();
            fetchCamions('PARKING');
        }, 15000); // Faster background refresh
        return () => clearInterval(interval);
    }, [fetchQuais, fetchCamions]);

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        if (result.destination.droppableId.startsWith('quai-')) {
            const quaiId = result.destination.droppableId.replace('quai-', '');
            const quai = quais.find(q => q.id === quaiId);
            if (quai && !getActiveAssignment(quai)) {
                await assignerCamion(quaiId, result.draggableId);
            }
        }
    };

    const parkingCamions = camions.filter(c => c.status === 'PARKING');

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-6 animate-in fade-in duration-700 max-h-screen overflow-hidden">
                {/* Compact Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Warehouse className="text-slate-900" size={18} />
                         </div>
                         <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter leading-none">SIMBA LIVE</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Supervision Logistique</p>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attente: {parkingCamions.length}</span>
                        </div>
                        <div className="w-[1px] h-3 bg-slate-800"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docks: {quais.filter(q => getActiveAssignment(q)).length}/{quais.length}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-stretch min-h-[calc(100vh-160px)]">
                    
                    {/* PARKING ZONE (Slimmer, fits many trucks) */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-3 px-1 text-slate-500">
                             <TruckIcon size={14} />
                             <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Parking</h2>
                        </div>
                        
                        <Droppable droppableId="parking">
                            {(provided, snapshot) => (
                                <div 
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`bg-slate-900/30 rounded-[2rem] border-2 p-3 h-full flex flex-col gap-3 transition-all overflow-y-auto
                                        ${snapshot.isDraggingOver ? 'border-amber-500/20 bg-slate-900/50' : 'border-slate-800/40'}`}
                                >
                                    {parkingCamions.map((camion, index) => (
                                        <Draggable key={camion.id} draggableId={camion.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`relative p-2 rounded-2xl transition-all border flex flex-col items-center
                                                        ${snapshot.isDragging 
                                                            ? 'bg-amber-500 border-amber-400 scale-105 shadow-2xl z-50' 
                                                            : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 shadow-sm'
                                                        }`}
                                                >
                                                    <Truck 
                                                        matricule={camion.matricule}
                                                        color={snapshot.isDragging ? '#0f172a' : '#fff'}
                                                        className="scale-[0.6] -my-2"
                                                    />
                                                    <div className={`text-[9px] font-black font-mono mt-1 ${snapshot.isDragging ? 'text-slate-950' : 'text-white'}`}>
                                                        {camion.matricule}
                                                    </div>
                                                    <div className={`text-[8px] font-bold uppercase truncate w-full text-center ${snapshot.isDragging ? 'text-slate-800' : 'text-slate-500'}`}>
                                                        {camion.transporteur || 'SANS TRANSP.'}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>

                    {/* WAREHOUSE ZONE (Wider, Higher Density) */}
                    <div className="col-span-10 flex flex-col">
                        <div className="bg-white rounded-[2.5rem] flex-1 p-6 relative shadow-2xl flex flex-col">
                            {/* Compressed Building Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-950 tracking-tighter">ENTREPOT SIMBA</h3>
                                <div className="text-[9px] font-black tracking-widest text-slate-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ZONE OPÉRATIONNELLE
                                </div>
                            </div>

                            {/* DOCK GRID - High Density */}
                            <div className="flex-1 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-2 gap-y-4 items-start content-start overflow-y-auto px-2">
                                {quais.map((quai, index) => {
                                    const active = getActiveAssignment(quai);
                                    return (
                                        <Droppable key={quai.id} droppableId={`quai-${quai.id}`} isDropDisabled={!!active}>
                                            {(provided, snapshot) => (
                                                <div 
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className="flex flex-col items-center group/slot"
                                                >
                                                    {/* Compact Dock Label */}
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <span className="text-[8px] font-black text-slate-400 opacity-50 uppercase">#{index+1}</span>
                                                        <span className="text-[10px] font-bold text-slate-900 truncate max-w-[50px]">{quai.nom}</span>
                                                    </div>

                                                    {/* Optimized Slot Box */}
                                                    <div className={`relative w-[60px] h-[160px] rounded-xl border-2 flex flex-col items-center pt-2 transition-all
                                                        ${active 
                                                            ? 'bg-slate-50 border-slate-100' 
                                                            : snapshot.isDraggingOver 
                                                                ? 'bg-amber-500/10 border-amber-500 border-dashed scale-110 z-10' 
                                                                : 'bg-slate-100/30 border-slate-200/60 border-dashed'
                                                        }`}
                                                    >
                                                        {active ? (
                                                            <QuaiCamion 
                                                                assignment={active} 
                                                                onLiberer={() => libererQuai(active.id)} 
                                                            />
                                                        ) : (
                                                            <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                                                                <div className={`text-[8px] font-black uppercase tracking-tighter -rotate-90 whitespace-nowrap transition-colors
                                                                    ${snapshot.isDraggingOver ? 'text-amber-500' : 'text-slate-300'}`}>
                                                                    LIBRE
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DragDropContext>
    );
}
