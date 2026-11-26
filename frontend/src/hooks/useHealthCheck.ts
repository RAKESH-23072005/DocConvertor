import { useEffect, useState } from 'react';
import { fetchHealth } from '../services/healthService';
import type { HealthResponse } from '../types/api';

interface HealthState {
  status: 'loading' | 'online' | 'offline';
  data: HealthResponse | null;
}

export function useHealthCheck(): HealthState {
  const [state, setState] = useState<HealthState>({
    status: 'loading',
    data: null,
  });

  useEffect(() => {
    let active = true;

    fetchHealth()
      .then((data) => {
        if (active) {
          setState({ status: 'online', data });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: 'offline', data: null });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
