import axios, { AxiosResponse } from 'axios';

export type Host = {
  id: string;
  insights_id: string;
  display_name: string;
  per_reporter_staleness: {
    puptoo?: {
      last_check_in: string;
    };
  };
  system_profile: {
    operating_system?: {
      major: number;
      minor: number;
      name: string;
    };
  };
};

export const getHosts = async () => {
  const response = await axios.get<{ results: Host[] }>('/api/inventory/v1/hosts', {
    params: {
      page: 1,
      per_page: 20,
      order_by: 'updated',
      order_how: 'DESC',
      'fields[system_profile]': ['operating_system'],
    },
  });

  return response.data;
};

const hostCache: {
  [key: string]: Promise<AxiosResponse<{ count: number; results: { [key: string]: number } }>>;
} = {};

export const getHostTags = async (hostId: string) => {
  if (!hostId) {
    return { count: 0, results: {} };
  }
  if (!hostCache[hostId]) {
    const p = axios.get<{
      count: number;
      results: { [key: string]: number };
    }>(`/api/inventory/v1/hosts/${hostId}/tags/count`);

    hostCache[hostId] = p;
    const result = await p;
    return result.data;
  }

  const result = await hostCache[hostId];
  return result.data;
};

const cveCache: {
  [hostId: string]: Promise<{
    criticalCount: number;
    highCount: number;
    allCount: number;
  }>;
} = {};

export const getHostCVEs = async (hostId: string): Promise<{ criticalCount: number; highCount: number; allCount: number }> => {
  if (!cveCache[hostId]) {
    const p = new Promise<{
      criticalCount: number;
      highCount: number;
      allCount: number;
    }>((resolve) => {
      const criticalPromise = axios.get<{
        meta: {
          total_items: number;
        };
      }>(`/api/vulnerability/v1/systems/${hostId}/cves`, {
        params: {
          business_risk_id: 4,
        },
      });
      const highPromise = axios.get<{
        meta: {
          total_items: number;
        };
      }>(`/api/vulnerability/v1/systems/${hostId}/cves`, {
        params: {
          business_risk_id: 3,
        },
      });
      const allPromise = axios.get<{
        meta: {
          total_items: number;
        };
      }>(`/api/vulnerability/v1/systems/${hostId}/cves`, {});

      return Promise.all([criticalPromise, highPromise, allPromise])
        .then((result) => {
          return resolve({
            criticalCount: result[0].data.meta.total_items,
            highCount: result[1].data.meta.total_items,
            allCount: result[2].data.meta.total_items,
          });
        })
        .catch(() => {
          return resolve({ criticalCount: 0, highCount: 0, allCount: 0 });
        });
    });

    cveCache[hostId] = p;
    return p;
  }

  return cveCache[hostId];
};
