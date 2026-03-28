import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
    isLoading, 
    variant = 'primary', 
    children, 
    className = '', 
    disabled,
    ...props 
}) => {
    const baseStyle = "flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
    
    const variants = {
        primary: "bg-[var(--amber)] text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20",
        secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
        ghost: "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100"
    };

    return (
        <button 
            disabled={isLoading || disabled}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin h-4 w-4 text-inherit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span>{children}</span>
        </button>
    );
};

export default Button;
