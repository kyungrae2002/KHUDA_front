import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import useTripStore from '../../store/useTripStore';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const resetTrip = useTripStore((state) => state.resetTrip);
  const navigate = useNavigate();
  const location = useLocation();

  const handleReset = () => {
    if (window.confirm('모든 입력 내용과 대화 내역이 초기화됩니다. 계속하시겠습니까?')) {
      resetTrip();
      navigate('/');
    }
  };

  return (
    <div className="w-full sticky top-0 z-50">
      {/* Main Navigation Bar */}
      <header className="w-full bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        {/* Left: Bold Logo */}
        <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => navigate('/')}>
          <div className="bg-slate-950 text-white p-1.5 rounded-lg">
            <Compass className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-slate-950 m-0 uppercase leading-none font-sans">
              Travel<span className="text-slate-400 font-medium">AI</span>
            </h1>
          </div>
        </div>

        {/* Center/Right: Horizontal Menu & Action Buttons */}
        <div className="flex items-center space-x-6 md:space-x-8">
          <nav className="hidden md:flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <a href="/" className="hover:text-slate-900 transition-colors">Home</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center space-x-3">
            {location.pathname !== '/' && (
              <button
                onClick={() => navigate('/')}
                className="btn-pill-outline py-1 px-3 text-[10px] leading-relaxed uppercase tracking-wider"
              >
                대화 수정
              </button>
            )}
            
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-rose-50 border border-transparent hover:border-rose-100"
              title="계획 초기화"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-semibold">초기화</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
