import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore';
import MapView from '../components/map/MapView';
import PlanTimeline from '../components/map/PlanTimeline';
import ViolationBanner from '../components/map/ViolationBanner';
import BackButton from '../components/common/BackButton';
import { type GeocodedPlace } from '../types/trip';
import { Map as MapIcon, List } from 'lucide-react';

// ─── Component ────────────────────────────────────────────────────────────────

export const PlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { itinerary } = useTripStore();
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map'>('timeline');
  const [activeDay, setActiveDay] = useState(itinerary?.narrative[0]?.day_index ?? 1);

  // Safety redirect
  useEffect(() => {
    if (!itinerary) navigate('/');
  }, [itinerary, navigate]);

  // Compute activeDayPlaces directly from the backend response for the currently selected day
  const activeDayPlaces: GeocodedPlace[] = React.useMemo(() => {
    if (!itinerary) return [];
    
    // Find the day data
    const activeDayData = itinerary.narrative.find(d => d.day_index === activeDay) || itinerary.narrative[0];
    if (!activeDayData) return [];
    
    // We do NOT deduplicate here, because marker order/numbering (1, 2, 3...) matters for a route.
    // However, if the same place is visited twice on the same day, it will get a marker both times.
    return activeDayData.items.filter(i => i.lat && i.lng).map(item => ({
      place_name: item.place_name,
      lat: item.lat,
      lng: item.lng
    }));
  }, [itinerary, activeDay]);

  const defaultCenter = activeDayPlaces.length > 0 
    ? { lat: activeDayPlaces[0].lat, lng: activeDayPlaces[0].lng } 
    : null;

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-400">
        <p className="text-sm">대화 내역을 불러오고 있습니다...</p>
      </div>
    );
  }

  const handleSelectPlace = (placeName: string, _coords: { lat: number; lng: number }) => {
    setSelectedPlaceName((prev) => (prev === placeName ? null : placeName));
  };

  return (
    <div className="relative flex flex-col h-screen bg-white text-slate-900 overflow-hidden">

      {/* Violation banner */}
      {itinerary.violations.length > 0 && (
        <ViolationBanner violations={itinerary.violations} />
      )}

      {/* Meta bar — back button + trip info + mobile tab switcher */}
      <div className="bg-white border-b border-slate-100 px-3 md:px-5 py-2 flex items-center justify-between gap-3">
        <BackButton to="/chat" label="Back to chat" floating={false} />

        {/* Trip info */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-black text-slate-900 uppercase tracking-tight">
            {itinerary.narrative.length}일 여행 일정
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">{activeDayPlaces.length}개 장소</span>
        </div>

        {/* Mobile tab switcher */}
        <div className="flex md:hidden bg-slate-100 p-0.5 rounded-xl flex-shrink-0">
          {(['timeline', 'map'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
              }`}
            >
              {tab === 'timeline' ? <List className="h-3 w-3" /> : <MapIcon className="h-3 w-3" />}
              <span>{tab === 'timeline' ? '일정' : '지도'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <main className="flex-1 flex min-h-0">
        {/* Timeline */}
        <section className={`w-full md:w-[400px] lg:w-[440px] flex-shrink-0 p-3 border-r border-slate-100 overflow-y-auto ${
          activeTab === 'timeline' ? 'block' : 'hidden md:block'
        }`}>
          <PlanTimeline
            days={itinerary.narrative}
            selectedPlaceName={selectedPlaceName}
            activeDay={activeDay}
            onDayChange={setActiveDay}
            onSelectPlace={(name, coords) => {
              handleSelectPlace(name, coords);
              if (window.innerWidth < 768) setActiveTab('map');
            }}
          />
        </section>

        {/* Map */}
        <section className={`flex-1 min-h-0 relative ${activeTab === 'map' ? 'block' : 'hidden md:block'}`}>
          <MapView
            geocodedPlaces={activeDayPlaces}
            selectedPlaceName={selectedPlaceName}
            onSelectPlace={(place) => setSelectedPlaceName(place?.place_name ?? null)}
            defaultCenter={defaultCenter}
          />
        </section>
      </main>
    </div>
  );
};

export default PlanPage;
