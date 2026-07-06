import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { type GeocodedPlace } from '../../types/trip';
import useTripStore from '../../store/useTripStore';
import { AlertCircle, MapPin } from 'lucide-react';
import { PlanMarkers } from './PlanMarkers';

interface MapViewProps {
  geocodedPlaces: GeocodedPlace[];
  selectedPlaceName: string | null;
  onSelectPlace: (place: GeocodedPlace | null) => void;
  defaultCenter?: { lat: number; lng: number } | null;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const mapContainerStyle = { width: '100%', height: '100%' };

// ─── Light map style ──────────────────────────────────────────────────────────
const lightMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8f0' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5f0e0' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
];

// ─── Simulation Map Fallback (light) ─────────────────────────────────────────

function SimulationMap({
  places,
  selectedPlaceName,
  onSelectPlace,
}: {
  places: GeocodedPlace[];
  selectedPlaceName: string | null;
  onSelectPlace: (place: GeocodedPlace | null) => void;
}) {
  if (places.length === 0) {
    return (
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <MapPin className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm">장소 정보를 불러오고 있습니다...</p>
      </div>
    );
  }

  const lats = places.map((p) => p.lat);
  const lngs = places.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const pct = (lat: number, lng: number) => ({
    x: `${15 + ((lng - minLng) / lngRange) * 70}%`,
    y: `${80 - ((lat - minLat) / latRange) * 60}%`,
  });

  const selected = places.find((p) => p.place_name === selectedPlaceName) ?? null;

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden select-none">
      {/* No-key notice */}
      <div className="absolute top-3 left-3 right-3 z-10 bg-white border border-amber-200 rounded-xl px-4 py-2.5 flex items-center space-x-2 shadow-sm text-left">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-[10px] font-black text-slate-800">Simulation Map</p>
          <p className="text-[10px] text-slate-500">Google Maps API 키가 없어 시뮬레이션 모드로 동작합니다.</p>
        </div>
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Route lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {places.map((place, idx) => {
          if (idx === places.length - 1) return null;
          const next = places[idx + 1];
          const a = pct(place.lat, place.lng);
          const b = pct(next.lat, next.lng);
          return (
            <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              className="stroke-slate-300 stroke-2" strokeDasharray="6,4" />
          );
        })}
      </svg>

      {/* Markers */}
      {places.map((place, idx) => {
        const pos = pct(place.lat, place.lng);
        const isSel = place.place_name === selectedPlaceName;
        return (
          <button
            key={place.place_name}
            onClick={() => onSelectPlace(isSel ? null : place)}
            style={{ left: pos.x, top: pos.y }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
          >
            <div className={`flex items-center justify-center rounded-full text-[10px] font-black border-2 border-white shadow-md transition-all ${
              isSel ? 'w-8 h-8 bg-slate-950 text-white scale-125 ring-2 ring-slate-400' : 'w-6 h-6 bg-white text-slate-800 hover:scale-110'
            }`}>
              {idx + 1}
            </div>
            <span className={`mt-1 text-[9px] font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity ${isSel ? 'opacity-100' : ''}`}>
              {place.place_name}
            </span>
          </button>
        );
      })}

      {/* Info popup */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white border border-slate-950 rounded-2xl p-4 shadow-lg z-20 animate-slide-up text-left">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-black text-slate-900">{selected.place_name}</h4>
            <button onClick={() => onSelectPlace(null)} className="text-xs text-slate-400 hover:text-slate-700 ml-2">✕</button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">좌표: {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const MapView: React.FC<MapViewProps> = ({ geocodedPlaces, selectedPlaceName, onSelectPlace, defaultCenter }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const { clientSlots } = useTripStore();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'google-map-script',
  });

  // Pan to selected place
  useEffect(() => {
    if (!map || !selectedPlaceName) return;
    const place = geocodedPlaces.find((p) => p.place_name === selectedPlaceName);
    if (place) {
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(15);
    }
  }, [selectedPlaceName, map, geocodedPlaces]);

  // Clear directions when day/places change
  useEffect(() => {
    setDirections(null);
  }, [geocodedPlaces]);

  const directionsCallback = React.useCallback(
    (res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (res !== null) {
        if (status === 'OK') {
          setDirections(res);
        } else {
          console.warn('Directions query failed:', status);
        }
      }
    },
    []
  );

  if (!GOOGLE_MAPS_API_KEY || loadError) {
    return <SimulationMap places={geocodedPlaces} selectedPlaceName={selectedPlaceName} onSelectPlace={onSelectPlace} />;
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-slate-900 border-slate-200 mr-3" />
        <span className="text-sm">지도를 불러오는 중...</span>
      </div>
    );
  }

  const center = geocodedPlaces.length > 0
    ? { lat: geocodedPlaces[0].lat, lng: geocodedPlaces[0].lng }
    : (defaultCenter || { lat: 37.5665, lng: 126.978 });

  const selectedPlace = geocodedPlaces.find((p) => p.place_name === selectedPlaceName) ?? null;

  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (geocodedPlaces.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      geocodedPlaces.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstance.fitBounds(bounds);
    }
  };

  const transportSlot = clientSlots.find(s => s.field === 'transport')?.value || '';
  const isDriving = transportSlot.includes('렌트카') || transportSlot.includes('차') || transportSlot.includes('택시');
  const travelMode = isDriving ? window.google.maps.TravelMode.DRIVING : window.google.maps.TravelMode.TRANSIT;

  const hasRoute = geocodedPlaces.length >= 2;
  const origin = hasRoute ? { lat: geocodedPlaces[0].lat, lng: geocodedPlaces[0].lng } : null;
  const destination = hasRoute ? { lat: geocodedPlaces[geocodedPlaces.length - 1].lat, lng: geocodedPlaces[geocodedPlaces.length - 1].lng } : null;
  const waypoints = hasRoute && geocodedPlaces.length > 2
    ? geocodedPlaces.slice(1, -1).map(p => ({
        location: { lat: p.lat, lng: p.lng },
        stopover: true,
      }))
    : [];

  return (
    <div className="w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={() => setMap(null)}
        options={{
          styles: lightMapStyles,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        <PlanMarkers places={geocodedPlaces} onMarkerClick={onSelectPlace} />

        {selectedPlace && (
          <InfoWindow
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => onSelectPlace(null)}
          >
            <div className="p-2 max-w-[220px]">
              <p className="text-xs font-black text-slate-900">{selectedPlace.place_name}</p>
            </div>
          </InfoWindow>
        )}

        {/* Request Directions */}
        {hasRoute && !directions && origin && destination && (
          <DirectionsService
            options={{
              origin,
              destination,
              travelMode,
              waypoints,
            }}
            callback={directionsCallback}
          />
        )}

        {/* Render Directions */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#0ea5e9',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              },
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default MapView;
