import React from 'react';
import { type DayNarrativeOut } from '../../types/trip';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';

interface PlanTimelineProps {
  days: DayNarrativeOut[];
  selectedPlaceName: string | null;
  activeDay: number;
  onDayChange: (dayIndex: number) => void;
  onSelectPlace: (placeName: string, coords: { lat: number; lng: number }) => void;
}

export const PlanTimeline: React.FC<PlanTimelineProps> = ({
  days,
  selectedPlaceName,
  activeDay,
  onDayChange,
  onSelectPlace,
}) => {
  const activeDayData = days.find((d) => d.day_index === activeDay);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm text-left">
      {/* Day tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/60 p-2 overflow-x-auto gap-2">
        {days.map((day) => (
          <button
            key={day.day_index}
            onClick={() => onDayChange(day.day_index)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeDay === day.day_index
                ? 'bg-slate-950 text-white'
                : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-900 hover:border-slate-400'
            }`}
          >
            Day {day.day_index + 1}
          </button>
        ))}
      </div>

      {/* Day narrative */}
      {activeDayData && (
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {/* Narrative summary */}
          <div className="flex items-start space-x-2.5 p-4 border-b border-slate-100 bg-slate-50/40">
            <BookOpen className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">{activeDayData.narrative}</p>
          </div>

          {/* Items */}
          <div className="p-3 space-y-3">
            {activeDayData.items.map((item, idx) => {
              const coords = { lat: item.lat, lng: item.lng };
              const isSelected = selectedPlaceName === item.place_name;

              return (
                <button
                  key={item.place_id}
                  onClick={() => onSelectPlace(item.place_name, coords)}
                  className={`w-full flex items-start space-x-3 p-3.5 rounded-xl border text-left transition-all duration-200 group ${
                    isSelected
                      ? 'bg-slate-950 border-slate-950 text-white'
                      : 'bg-white border-slate-200 hover:border-slate-400 disabled:opacity-60'
                  }`}
                >
                  {/* Sequence bubble */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                      isSelected
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-100 text-slate-600 border-slate-200 group-hover:border-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {item.place_name}
                      </span>
                      {item.reservation_badge && (
                        <span className={`flex-shrink-0 text-[9px] font-bold border rounded-full px-2 py-0.5 ${
                          isSelected ? 'border-white/40 text-white/80' : 'border-amber-300 text-amber-600 bg-amber-50'
                        }`}>
                          {item.reservation_badge}
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center space-x-2 mt-1 text-[10px] font-semibold ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                      <Clock className="h-3 w-3" />
                      <span>{item.arrival_time_label}</span>
                      <span>·</span>
                      <span className="capitalize">{item.time_period}</span>
                    </div>

                    {item.selection_reason && (
                      <p className={`text-[10px] mt-1.5 leading-relaxed line-clamp-2 ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                        {item.selection_reason}
                      </p>
                    )}

                  </div>

                  <ChevronRight className={`h-4 w-4 flex-shrink-0 self-center ${isSelected ? 'text-white/50' : 'text-slate-300 group-hover:text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanTimeline;
