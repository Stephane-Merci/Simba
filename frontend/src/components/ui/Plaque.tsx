/** Plaque d'immatriculation (style européen, bandeau bleu à gauche). */
export default function Plaque({ matricule, taille = 'md' }: { matricule: string; taille?: 'sm' | 'md' | 'lg' | 'xl' }) {
    const t = {
        sm: { box: 'h-5 text-[10px]', band: 'w-2.5 text-[6px]', pad: 'px-1.5' },
        md: { box: 'h-6 text-xs', band: 'w-3 text-[7px]', pad: 'px-2' },
        lg: { box: 'h-8 text-base', band: 'w-4 text-[9px]', pad: 'px-2.5' },
        xl: { box: 'h-12 text-2xl', band: 'w-6 text-xs', pad: 'px-4' },
    }[taille];
    return (
        <span
            className={`inline-flex shrink-0 select-none items-stretch overflow-hidden rounded-md border border-slate-900/80 bg-white font-mono font-extrabold tracking-wider text-slate-900 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_2px_6px_-2px_rgba(15,23,42,0.35)] ${t.box}`}
        >
            <span className={`flex flex-col items-center justify-center bg-blue-700 ${t.band}`}>
                <span className="h-[35%] w-[55%] rounded-full border border-dotted border-yellow-300" />
            </span>
            <span className={`flex items-center whitespace-nowrap ${t.pad}`}>{matricule}</span>
        </span>
    );
}
