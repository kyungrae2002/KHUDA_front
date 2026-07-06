import React from 'react';
import { Marker } from '@react-google-maps/api';
import { type GeocodedPlace } from '../../types/trip';

interface PlanMarkersProps {
  places: GeocodedPlace[];
  onMarkerClick: (place: GeocodedPlace) => void;
}

export const PlanMarkers: React.FC<PlanMarkersProps> = ({ places, onMarkerClick }) => {
  return (
    <>
      {places.map((place, idx) => (
        <Marker
          key={`${place.place_name}-${idx}`}
          position={{ lat: place.lat, lng: place.lng }}
          onClick={() => onMarkerClick(place)}
          label={{
            text: String(idx + 1),
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
          }}
          title={place.place_name}
        />
      ))}
    </>
  );
};

export default PlanMarkers;
