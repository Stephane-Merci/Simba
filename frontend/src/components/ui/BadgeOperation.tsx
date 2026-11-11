import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { OPERATIONS } from '../../lib/parcours';
import type { Operation } from '../../types';

export function IconeOperation({ operation, size = 14 }: { operation: Operation; size?: number }) {
    return operation === 'DECHARGEMENT' ? <ArrowDownToLine size={size} /> : <ArrowUpFromLine size={size} />;
}

export default function BadgeOperation({ operation, compact }: { operation: Operation; compact?: boolean }) {
    const o = OPERATIONS[operation];
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ background: o.douce, color: o.couleur }}
            title={o.aide}
        >
            <IconeOperation operation={operation} size={12} />
            {!compact && o.libelle}
        </span>
    );
}
