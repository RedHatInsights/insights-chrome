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

export type HostApiOptions = { page?: number; perPage?: number; orderBy?: 'updated' | 'display_name' | 'id'; orderHow?: 'ASC' | 'DESC' };

export const getHosts = async ({ orderBy = 'updated', orderHow = 'DESC', page = 1, perPage = 20 }: HostApiOptions) => {
  const response = await axios.get<{ results: Host[] }>('/api/inventory/v1/hosts', {
    params: {
      page,
      per_page: perPage,
      order_by: orderBy,
      order_how: orderHow,
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

export type AdvisorSystem = {
  critical_hits: number;
  important_hits: number;
  moderate_hits: number;
  low_hits: number;
};

export const getHostInsights = async (hostId: string) => {
  try {
    const { data } = await axios.get<AdvisorSystem>(`/api/insights/v1/system/${hostId}`);
    return data;
  } catch (error) {
    return 'unknown';
  }
};

export type PatchSystem = {
  attributes: {
    installable_rhba_count: number;
    installable_rhea_count: number;
    installable_rhsa_count: number;
  };
};

export const getHostPatch = async (hostId: string) => {
  try {
    const { data } = await axios.get<{ data: PatchSystem }>(`/api/patch/v3/systems/${hostId}`);
    return data.data;
  } catch (error) {
    return 'unknown';
  }
};
