import axios from 'axios';
import { type UploadResponse, type SlotOut } from '../types/trip';

// ─── Environment ──────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !BACKEND_URL;

const backendClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60_000,
});

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ALL_CONFIRMED: SlotOut[] = [
  { field: 'destination', value: '제주도',              status: 'confirmed', confidence: 0.95, evidence_message_ids: [1] },
  { field: 'date',        value: '2025-08-10 ~ 08-13', status: 'confirmed', confidence: 0.90, evidence_message_ids: [3] },
  { field: 'budget',      value: '1인 50만원',           status: 'confirmed', confidence: 0.85, evidence_message_ids: [5] },
  { field: 'headcount',   value: '2명',                 status: 'confirmed', confidence: 0.92, evidence_message_ids: [7] },
  { field: 'transport',   value: '렌트카',               status: 'confirmed', confidence: 0.88, evidence_message_ids: [9] },
  { field: 'constraint',  value: '없음',                 status: 'confirmed', confidence: 0.80, evidence_message_ids: [11] },
  { field: 'wishlist',    value: '야경, 맛집 탐방',       status: 'confirmed', confidence: 0.87, evidence_message_ids: [13] },
];

let mockSessionCounter = 100;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload the final LLM-generated JSON as a Blob to POST /sessions/upload.
 *
 * ⚠️ This endpoint is called EXACTLY ONCE per user session (or once more
 * if the backend rejects some slots and a correction loop is needed).
 * It is NEVER called mid-conversation.
 */
export async function uploadConversation(jsonBlob: Blob): Promise<UploadResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));
    return {
      session_id: ++mockSessionCounter,
      slots: MOCK_ALL_CONFIRMED,
      raw_unparsed_count: 0,
    };
  }

  const formData = new FormData();
  formData.append('file', jsonBlob, 'conversation.json');

  const targetUrl = `${backendClient.defaults.baseURL}/sessions/upload`;
  console.log(`[sessionApi] Sending POST request to: ${targetUrl}`);

  const { data } = await backendClient.post<UploadResponse>('/sessions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
}
