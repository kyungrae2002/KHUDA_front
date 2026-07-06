// ─── Backend Schema Types (mirror travel-buddy OpenAPI 1:1) ──────────────────

export type SlotField =
  | 'destination'
  | 'date'
  | 'budget'
  | 'headcount'
  | 'transport'
  | 'constraint'
  | 'wishlist';

export type SlotStatus = 'confirmed' | 'undecided' | 'conflict';

export interface SlotOut {
  field: SlotField;
  value: string;
  status: SlotStatus;
  confidence: number;
  evidence_message_ids: number[];
}

export interface UploadResponse {
  session_id: number;
  slots: SlotOut[];
  raw_unparsed_count: number;
}

export interface ItemNarrativeOut {
  place_id: number;
  place_name: string;
  time_period: string;            // e.g. "morning" | "afternoon" | "evening"
  arrival_time: string;
  arrival_time_label: string;
  reservation_badge: string;      // e.g. "Reservation required"
  selection_reason: string | null;
  lat: number;
  lng: number;
}

export interface DayNarrativeOut {
  day_index: number;
  narrative: string;
  items: ItemNarrativeOut[];
}

export interface ViolationOut {
  type: string;
  item_id: number;
  description: string;
}

export interface ItineraryResponse {
  narrative: {
    days: DayNarrativeOut[];
  };
  iterations_used: number;
  violations: ViolationOut[];
}

// ─── Frontend-only Types ─────────────────────────────────────────────────────

/** LLM-compatible message format (role matches OpenAI convention) */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/** Cached geocoding result for a place name */
export interface GeocodedPlace {
  place_name: string;
  lat: number;
  lng: number;
}

/** Stored itinerary shape in Zustand */
export interface StoredItinerary {
  narrative: DayNarrativeOut[];
  iterationsUsed: number;
  violations: ViolationOut[];
}
