import { AdmissionQuota, CreateQuotaDto, UpdateQuotaDto, QuotaAvailability } from '@/types/quota';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export const quotasApi = {
  getAll: async (token: string): Promise<AdmissionQuota[]> => {
    const res = await fetch(`${API_URL}/quotas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al obtener cupos');
    return res.json();
  },

  getById: async (token: string, id: string): Promise<AdmissionQuota> => {
    const res = await fetch(`${API_URL}/quotas/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al obtener cupo');
    return res.json();
  },

  create: async (token: string, data: CreateQuotaDto): Promise<AdmissionQuota> => {
    const res = await fetch(`${API_URL}/quotas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al crear cupo');
    }
    return res.json();
  },

  update: async (token: string, id: string, data: UpdateQuotaDto): Promise<AdmissionQuota> => {
    const res = await fetch(`${API_URL}/quotas/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al actualizar cupo');
    }
    return res.json();
  },

  delete: async (token: string, id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/quotas/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al eliminar cupo');
  },

  seed: async (token: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/quotas/seed`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Error al ejecutar seed');
    return res.json();
  },

  checkAvailability: async (token: string, level: string, shift: string, specialty?: string): Promise<QuotaAvailability> => {
    const params = new URLSearchParams({ gradeLevel: level, shift });
    if (specialty) params.append('specialty', specialty);
    
    // Note: checkAvailability might be public or protected. Assuming protected based on controller.
    const res = await fetch(`${API_URL}/quotas/check-availability?${params.toString()}`, {
         headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Error checking availability');
    return res.json();
  }
};
