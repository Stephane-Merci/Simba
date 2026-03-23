import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getActiveAssignment, formatElapsed } from '../types';
import Truck from '../components/Truck';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Truck as TruckIcon, Info, Warehouse, ArrowRight, Timer, Plus, Minus } from 'lucide-react';

// Sub-component for a live ticking truck info (VERTICAL REFINED VERSION)
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
        <div className="flex-1 flex flex-col items-center justify-between py-1 group/camion relative h-full">
            {/* Truck in Middle - Vertical */}
            <div className="flex-1 flex items-center justify-center -my-3">
                <Truck 
                    orientation="vertical" 
                    color="#1e293b"
                    matricule={assignment.camion?.matricule}
                    className="scale-[0.85] transition-transform group-hover/camion:scale-[0.88]"
                />
            </div>
            
            {/* Time Below */}
            <div className="text-[8px] font-black font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded shadow-sm">
                {elapsed}
            </div>

            {/* Hidden button until hover */}
            <button 
                onClick={onLiberer}
                className="absolute top-1/2 -right-1 -translate-y-1/2 bg-red-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover/camion:opacity-100 transition-all hover:scale-110 z-30"
                title="Libérer"
            >
                <ArrowRight size={10} />
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
        if (newParkingName.trim()) {
            await createParkingSection(newParkingName, newParkingCap);
            setShowParkingModal(false);
        }
    };

    const arrivees = camions.filter(c => c.status === 'PARTI');
    const totalParked = camions.filter(c => c.status === 'PARKING').length;
    
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="h-[calc(100vh-120px)] flex flex-col gap-4 animate-in fade-in duration-500 overflow-hidden">
                {/* Header - Compact */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/20">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Warehouse className="text-slate-900" size={18} />
                         </div>
                         <div>
                            <h1 className="text-2xl font-black text-slate-50 tracking-tighter leading-none">SIMBA LIVE</h1>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-6 px-6 py-1.5 bg-slate-900/40 rounded-xl border border-slate-800/60 font-mono">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Attente: {arrivees.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parking: {totalParked}</span>
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
                                    className={`bg-slate-900/40 rounded-xl border-2 p-2 min-h-[60px] flex items-center gap-1.5 transition-all overflow-x-auto custom-scrollbar-mini
                                        ${snapshot.isDraggingOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-800/40'}`}
                                >
                                    {arrivees.map((camion, index) => (
                                        <Draggable key={camion.id} draggableId={camion.id} index={index}>
                                            {(p, s) => (
                                                <div
                                                    ref={p.innerRef}
                                                    {...p.draggableProps}
                                                    {...p.dragHandleProps}
                                                    className={`shrink-0 w-16 h-8 rounded-lg border flex flex-col items-center justify-center transition-all
                                                        ${s.isDragging ? 'bg-blue-600 border-white z-50 scale-110 shadow-xl' : 'bg-slate-800 border-slate-700'}`}
                                                >
                                                    <Truck matricule={camion.matricule} className="scale-[0.25] -my-4" />
                                                    <span className="text-[7.5px] font-black font-mono text-slate-300 truncate w-full text-center">{camion.matricule}</span>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {/* BOTTOM: QUAI ZONE (Grid of vertical slots) */}
                        <div className="flex-1 bg-white rounded-3xl p-3 shadow-xl flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-2 px-1 border-b border-slate-100">
                                <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest">Quais de Déchargement</h3>
                                <span className="text-[8px] font-black text-slate-400">OPERATIONAL GRID V3</span>
                            </div>

                            <div className="flex-1 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 xxl:grid-cols-12 gap-2 overflow-y-auto pr-1 custom-scrollbar content-start">
                                {quais.map((quai, index) => {
                                    const active = getActiveAssignment(quai);
                                    return (
                                        <Droppable key={quai.id} droppableId={`quai-${quai.id}`} isDropDisabled={!!active}>
                                            {(p, s) => (
                                                <div ref={p.innerRef} {...p.droppableProps} className="flex flex-col gap-0.5 min-w-[65px]">
                                                    {/* Quai Name on Top */}
                                                    <div className="flex items-center justify-center px-1">
                                                        <span className="text-[8px] font-black text-slate-900 truncate uppercase tracking-tighter">{quai.nom}</span>
                                                    </div>

                                                    {/* Quai Body (Vertical Body) */}
                                                    <div className={`h-[135px] rounded-xl border-2 flex flex-col transition-all relative
                                                        ${active 
                                                            ? 'bg-slate-50 border-slate-100' 
                                                            : s.isDraggingOver 
                                                                ? 'bg-amber-100 border-amber-500 scale-[1.03]' 
                                                                : 'bg-slate-50 border-slate-200/60 border-dashed border-2'
                                                        }`}
                                                    >
                                                        {active ? (
                                                            <QuaiCamion 
                                                                assignment={active} 
                                                                onLiberer={() => libererQuai(active.id)} 
                                                            />
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-center text-[8px] font-black text-slate-200 uppercase tracking-widest rotate-90">
                                                                LIBRE
                                                            </div>
                                                        )}
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
                    <div className="col-span-2 flex flex-col gap-3 min-h-0 bg-slate-900/10 rounded-2xl p-3 border border-slate-800/40">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                 <TruckIcon size={12} />
                                 <h2 className="text-[9px] font-black uppercase tracking-wider">Parking</h2>
                            </div>
                            <button onClick={handleAddParking} className="p-1 hover:text-white transition-colors"><Plus size={12} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar-mini pr-1">
                            {parkingSections.map(section => (
                                <div key={section.id} className="flex flex-col gap-1 group/sec">
                                    <div className="flex justify-between items-end px-1 pb-1">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-100 uppercase tracking-tight">{section.nom}</span>
                                            <span className={`text-[8px] font-black w-fit px-1.5 rounded-full mt-0.5 ${section.camions?.length >= section.capacite ? 'bg-red-500 text-slate-50' : 'text-slate-400 bg-slate-800'}`}>
                                                {section.camions?.length || 0} / {section.capacite}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => confirm(`Effacer la zone ${section.nom} ?`) && deleteParkingSection(section.id)}
                                            className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover/sec:opacity-100 transition-all mb-0.5"
                                        >
                                            <Minus size={10} />
                                        </button>
                                    </div>
                                    <Droppable droppableId={`parking-${section.id}`}>
                                        {(p, s) => (
                                            <div 
                                                ref={p.innerRef} {...p.droppableProps}
                                                className={`min-h-[100px] flex flex-wrap content-start gap-1 p-2 rounded-xl border border-dashed transition-all
                                                    ${s.isDraggingOver ? 'border-amber-500/50 bg-slate-900/60' : 'border-slate-800/40 bg-slate-900/20'}`}
                                            >
                                                {(section.camions || []).map((camion, i) => (
                                                    <Draggable key={camion.id} draggableId={camion.id} index={i}>
                                                        {(p_c, s_c) => (
                                                            <div 
                                                                ref={p_c.innerRef} {...p_c.draggableProps} {...p_c.dragHandleProps}
                                                                className={`w-[47%] h-9 rounded-lg border flex flex-col items-center justify-center shadow-sm
                                                                    ${s_c.isDragging ? 'bg-amber-600 border-white z-50 scale-110' : 'bg-slate-800 border-slate-700'}`}
                                                            >
                                                                <Truck matricule={camion.matricule} className="scale-[0.3] -my-4" />
                                                                <span className="text-[7.5px] font-bold font-mono text-white truncate px-1">
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
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] animate-in slide-in-from-bottom-4 flex items-center gap-3 border-2 border-white/20">
                    <Info className="animate-bounce" />
                    <div>
                        <p className="font-black text-sm uppercase tracking-wider">Parking Complet</p>
                        <p className="text-xs font-medium opacity-90">{parkingFullSection} est arrivé à sa capacité maximale.</p>
                    </div>
                </div>
            )}

            {/* Modal Adding Parking */}
            {showParkingModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in scale-in-95 duration-200">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                                <Warehouse className="text-slate-950" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Nouvelle Zone</h2>
                            <p className="text-slate-400 text-sm mb-8 font-medium">Définissez le nom et la capacité maximale de cette nouvelle aire de stationnement.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nom de la zone</label>
                                    <input 
                                        autoFocus
                                        value={newParkingName}
                                        onChange={e => setNewParkingName(e.target.value)}
                                        placeholder="Ex: Parking Nord, Attente A..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold placeholder:text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Capacité (véhicules)</label>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setNewParkingCap(Math.max(1, newParkingCap - 1))} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-slate-700"><Minus size={18} /></button>
                                        <div className="flex-1 text-center text-3xl font-black leading-none text-white font-mono">{newParkingCap}</div>
                                        <button onClick={() => setNewParkingCap(newParkingCap + 1)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-slate-700"><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/50 flex gap-3">
                            <button 
                                onClick={() => setShowParkingModal(false)}
                                className="flex-1 px-4 py-4 rounded-2xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={submitNewParking}
                                className="flex-[2] bg-amber-500 px-4 py-4 rounded-2xl text-slate-950 font-black hover:bg-amber-400 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/20"
                            >
                                Créer la zone
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DragDropContext>
    );
}
