import axios from 'axios';
import { type ItineraryResponse, type DayNarrativeOut } from '../types/trip';

// ─── Environment ──────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !BACKEND_URL;

const backendClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60_000, // itinerary generation can take a while
});

// ─── Mock Data ────────────────────────────────────────────────────────────────

function buildMockItinerary(days: number): ItineraryResponse {
  const dayTemplates: DayNarrativeOut[] = [
    {
      day_index: 1,
      narrative: '제주 공항에 도착 후 렌트카를 수령합니다. 오전에는 성산일출봉을 방문하고, 오후에는 섭지코지 해안 산책로를 걷습니다. 저녁은 동문재래시장에서 현지 먹거리를 즐깁니다.',
      items: [
        { place_id: 1, place_name: '성산일출봉', time_period: 'morning', arrival_time: '10:00', arrival_time_label: '오전 10시', reservation_badge: '', selection_reason: '세계자연유산, 일출 뷰 최고', lat: 0, lng: 0 },
        { place_id: 2, place_name: '섭지코지', time_period: 'afternoon', arrival_time: '13:30', arrival_time_label: '오후 1시 30분', reservation_badge: '', selection_reason: '이국적인 해안 절경', lat: 0, lng: 0 },
        { place_id: 3, place_name: '동문재래시장', time_period: 'evening', arrival_time: '18:00', arrival_time_label: '오후 6시', reservation_badge: '', selection_reason: '현지 야시장 분위기와 먹거리', lat: 0, lng: 0 },
      ],
    },
    {
      day_index: 2,
      narrative: '서귀포 방향으로 이동합니다. 천지연폭포와 외돌개를 관람하고, 맛집으로 유명한 이중섭 거리에서 점심을 즐깁니다. 오후에는 중문 관광단지를 방문합니다.',
      items: [
        { place_id: 4, place_name: '천지연폭포', time_period: 'morning', arrival_time: '09:30', arrival_time_label: '오전 9시 30분', reservation_badge: '', selection_reason: '웅장한 폭포 절경', lat: 0, lng: 0 },
        { place_id: 5, place_name: '이중섭 거리', time_period: 'afternoon', arrival_time: '12:00', arrival_time_label: '오후 12시', reservation_badge: '', selection_reason: '갤러리와 맛집이 모인 예술 거리', lat: 0, lng: 0 },
        { place_id: 6, place_name: '중문 관광단지', time_period: 'afternoon', arrival_time: '15:00', arrival_time_label: '오후 3시', reservation_badge: '', selection_reason: '해수욕장과 복합 리조트', lat: 0, lng: 0 },
      ],
    },
    {
      day_index: 3,
      narrative: '한림 방향으로 이동해 협재해변의 에메랄드빛 바다를 감상합니다. 근처 한림공원의 용암 동굴도 탐방합니다. 저녁에는 제주 공항 근처 흑돼지 거리에서 마무리합니다.',
      items: [
        { place_id: 7, place_name: '협재해수욕장', time_period: 'morning', arrival_time: '10:00', arrival_time_label: '오전 10시', reservation_badge: '', selection_reason: '제주 최고의 에메랄드 바다', lat: 0, lng: 0 },
        { place_id: 8, place_name: '한림공원', time_period: 'afternoon', arrival_time: '13:00', arrival_time_label: '오후 1시', reservation_badge: '', selection_reason: '용암 동굴과 열대 식물 정원', lat: 0, lng: 0 },
        { place_id: 9, place_name: '흑돼지 거리', time_period: 'evening', arrival_time: '18:30', arrival_time_label: '오후 6시 30분', reservation_badge: 'Reservation recommended', selection_reason: '제주 대표 먹거리, 흑돼지 구이', lat: 0, lng: 0 },
      ],
    },
  ];

  return {
    narrative: {
      days: dayTemplates.slice(0, Math.max(1, Math.min(days, 3))),
    },
    iterations_used: 2,
    violations: days > 3 ? [{ type: 'budget_exceeded', item_id: 9, description: '4일 이상의 일정은 예산 50만원을 초과할 수 있습니다.' }] : [],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate an itinerary for the given session.
 * POST /sessions/{session_id}/itinerary  body: { days }
 */
export async function createItinerary(
  sessionId: number,
  days: number
): Promise<ItineraryResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1_200 + Math.random() * 800));
    return buildMockItinerary(days);
  }

  const targetUrl = `${backendClient.defaults.baseURL}/sessions/${sessionId}/itinerary`;
  console.log(`[itineraryApi] Sending POST request to: ${targetUrl} with body:`, { days });

  const { data } = await backendClient.post<ItineraryResponse>(
    `/sessions/${sessionId}/itinerary`,
    { days },
    { timeout: 120_000 }
  );

  return data;
}
