import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-4 text-slate-100 transition-all duration-200 ${
        hoverable ? 'hover:bg-white/[0.08] hover:border-white/[0.14] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
