import type { Group, GroupWithPayments, Payment, Exclusion, SettleResult } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Unknown error');
  return json.data as T;
}

export const api = {
  createGroup: (name: string, members: string[]) =>
    request<Group>('/groups', { method: 'POST', body: JSON.stringify({ name, members }) }),

  getGroup: (id: string) => request<GroupWithPayments>(`/groups/${id}`),

  addPayment: (
    id: string,
    data: { memberId: string; description: string; totalAmount: number; exclusions: Exclusion[] },
  ) => request<Payment>(`/groups/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  updatePayment: (
    id: string,
    paymentId: string,
    data: Partial<{ memberId: string; description: string; totalAmount: number; exclusions: Exclusion[] }>,
  ) =>
    request<Payment>(`/groups/${id}/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  settle: (id: string) =>
    request<SettleResult>(`/groups/${id}/settle`, { method: 'POST' }),

  deletePayment: (id: string, paymentId: string) =>
    request<{ paymentId: string }>(`/groups/${id}/payments/${paymentId}`, { method: 'DELETE' }),
};
