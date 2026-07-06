import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to: string;
  label: string;
  /** When true (default), renders as absolute floating top-left. When false, renders inline. */
  floating?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({ to, label, floating = true }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center space-x-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors duration-200 group flex-shrink-0 ${
        floating ? 'absolute top-4 left-4 z-20' : ''
      }`}
      aria-label={label}
    >
      <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
