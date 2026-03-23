interface TruckProps {
    color?: string;
    matricule?: string;
    subLabel?: string;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

export default function Truck({ color = '#fff', matricule, subLabel, className = '', orientation = 'horizontal' }: TruckProps) {
    return (
        <div className={`relative flex flex-col items-center justify-center transition-all duration-300 ${className}`} style={{ 
            width: orientation === 'horizontal' ? '100px' : '40px', 
            height: orientation === 'horizontal' ? '40px' : '100px' 
        }}>
            <svg 
                viewBox={orientation === 'horizontal' ? "0 0 120 40" : "0 0 40 120"} 
                fill="none" 
                className="w-full h-full drop-shadow-lg"
            >
                {/* Truck Body (Trailer) */}
                <rect 
                    x={orientation === 'horizontal' ? "35" : "0"} 
                    y={orientation === 'horizontal' ? "5" : "35"} 
                    width={orientation === 'horizontal' ? "80" : "40"} 
                    height={orientation === 'horizontal' ? "30" : "80"} 
                    rx="1" 
                    fill={color} 
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="1.5"
                />
                
                {/* Cabin */}
                <rect 
                    x={orientation === 'horizontal' ? "5" : "5"} 
                    y={orientation === 'horizontal' ? "8" : "5"} 
                    width={orientation === 'horizontal' ? "28" : "30"} 
                    height={orientation === 'horizontal' ? "25" : "28"} 
                    rx="2" 
                    fill={color}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="1.5"
                />
                
                {/* Windows */}
                <rect 
                    x={orientation === 'horizontal' ? "20" : "8"} 
                    y={orientation === 'horizontal' ? "11" : "8"} 
                    width={orientation === 'horizontal' ? "8" : "24"} 
                    height={orientation === 'horizontal' ? "18" : "8"} 
                    rx="0.5" 
                    fill="#0f172a" 
                />

                {/* Wheels */}
                {orientation === 'horizontal' ? (
                    <>
                        <circle cx="15" cy="35" r="4" fill="#000" />
                        <circle cx="95" cy="35" r="4" fill="#000" />
                        <circle cx="110" cy="35" r="4" fill="#000" />
                    </>
                ) : (
                    <>
                        <circle cx="5" cy="115" r="3.5" fill="#000" />
                        <circle cx="35" cy="115" r="3.5" fill="#000" />
                        <circle cx="5" cy="22" r="3.5" fill="#000" />
                        <circle cx="35" cy="22" r="3.5" fill="#000" />
                    </>
                )}
            </svg>

            {/* Labels overlaying the truck */}
            {matricule && (
                <div className={`absolute z-10 flex flex-col items-center pointer-events-none
                    ${orientation === 'horizontal' ? 'left-[60%] top-1/2 -translate-y-1/2' : 'top-[60%] left-1/2 -translate-x-1/2'}`}>
                    <span className="bg-slate-900 text-white px-1 py-0.5 rounded-[2px] text-[8px] font-black font-mono shadow-md border border-white/20 leading-none">
                        {matricule}
                    </span>
                </div>
            )}
        </div>
    );
}

