import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-mesh-gradient text-slate-900 animate-slide-up">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col items-center justify-center relative text-center py-20 md:py-32">
        <div className="flex flex-col items-center space-y-6 md:space-y-9">

          {/* Subcopy */}
          <span className="text-[10px] md:text-xs font-bold tracking-widest text-sky-600 uppercase">
            Travel Buddy
          </span>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 uppercase leading-[0.96]">
            Plan your next
            <br />
            <span
              style={{
                backgroundImage: 'linear-gradient(to right, #38BDF8, #0284C7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              journey
            </span>{' '}
            with AI
          </h1>

          {/* Description */}
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-sm md:max-w-md">
            카카오톡 대화 파일을 업로드하면
            <br />
            AI가 여행 정보를 분석해 맞춤 일정을 만들어 드립니다.
          </p>

          {/* How it works */}
          <div className="flex items-center space-x-3 text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
            <span className="flex items-center space-x-1">
              <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[9px] font-black flex items-center justify-center">1</span>
              <span>Upload</span>
            </span>
            <span className="text-slate-400">—</span>
            <span className="flex items-center space-x-1">
              <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[9px] font-black flex items-center justify-center">2</span>
              <span>Chat</span>
            </span>
            <span className="text-slate-400">—</span>
            <span className="flex items-center space-x-1">
              <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[9px] font-black flex items-center justify-center">3</span>
              <span>Explore</span>
            </span>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="btn-pill-outline py-3 md:py-3.5 px-8 md:px-10 text-xs md:text-sm group uppercase tracking-widest"
            >
              <Upload className="h-4 w-4" />
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HeroSection;
