import type { HealthResponse } from '../types/api';
import { apiGet, resolveHealthCheckUrl } from './apiClient';

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>(resolveHealthCheckUrl(), true);
}
