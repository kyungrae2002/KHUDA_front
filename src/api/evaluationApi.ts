import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || '';

const backendClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15_000,
});

/**
 * GET /evaluation
 * Developer-facing evaluation endpoint — not exposed in the normal user flow.
 */
export async function getEvaluation(): Promise<unknown> {
  const { data } = await backendClient.get('/evaluation');
  return data;
}
