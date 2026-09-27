import React from 'react';
import { HyperlinkIcon } from './HyperlinkIcon';
import { useHyperlink } from '../../context/HyperlinkContext';

interface HyperlinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconRight?: string;
  loading?: boolean;
}

export const HyperlinkButton: React.FC<HyperlinkButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  let isLight = false;
  try {
    const ctx = useHyperlink();
    isLight = ctx?.isLightMode || false;
  } catch {
    isLight = false;
  }

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl select-none outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer';
  
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2 font-medium',
    lg: 'text-sm px-4 py-2.5 gap-2.5'
  };

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/30 active:scale-[0.98]',
    secondary: isLight
      ? 'bg-black/[0.04] hover:bg-black/[0.08] text-slate-800 border border-black/[0.1] hover:border-black/[0.2] active:scale-[0.98]'
      : 'bg-white/[0.05] hover:bg-white/[0.09] text-zinc-100 border border-white/[0.08] hover:border-white/[0.14] active:scale-[0.98]',
    ghost: isLight
      ? 'bg-transparent hover:bg-black/[0.05] text-slate-600 hover:text-slate-950'
      : 'bg-transparent hover:bg-white/[0.06] text-zinc-300 hover:text-white',
    danger: isLight
      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-[0.98]'
      : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 active:scale-[0.98]',
    accent: isLight
      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-[0.98]'
      : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 active:scale-[0.98]'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <HyperlinkIcon name="RefreshCw" size={size === 'sm' ? 13 : 15} className="animate-spin text-current" />
      ) : icon ? (
        <HyperlinkIcon name={icon} size={size === 'sm' ? 13 : 15} />
      ) : null}
      
      {children}

      {!loading && iconRight && (
        <HyperlinkIcon name={iconRight} size={size === 'sm' ? 13 : 15} />
      )}
    </button>
  );
};
