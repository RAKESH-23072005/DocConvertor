import type { HealthResponse } from '../types/api';
import { apiGet } from './apiClient';

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}
