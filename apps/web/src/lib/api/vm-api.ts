import { api } from '../api-client.js';

export const vmApi = {
  wake: (cid: string) => api.post<void>(`/companies/${cid}/vm/wake`),

  hibernate: (cid: string) => api.post<void>(`/companies/${cid}/vm/hibernate`),

  destroy: (cid: string) => api.post<void>(`/companies/${cid}/vm/destroy`),

  wakeAgent: (cid: string, aid: string) =>
    api.post<void>(`/companies/${cid}/vm/agents/${aid}/wakeup`),
};
