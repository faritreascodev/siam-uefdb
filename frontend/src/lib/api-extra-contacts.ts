const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ExtraContact {
  id?: string;
  applicationId: string;
  cedula: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  relationship: string;
  createdAt?: string;
  updatedAt?: string;
}

export const extraContactsApi = {
  // Get all contacts for an application
  getByApplication: async (applicationId: string, token: string): Promise<ExtraContact[]> => {
    const res = await fetch(`${API_URL}/extra-contacts/application/${applicationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al obtener contactos');
    }
    return res.json();
  },

  // Create a new contact
  create: async (data: ExtraContact, token: string): Promise<ExtraContact> => {
    const res = await fetch(`${API_URL}/extra-contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al crear contacto');
    }
    return res.json();
  },

  // Update a contact
  update: async (id: string, data: Partial<ExtraContact>, token: string): Promise<ExtraContact> => {
    const res = await fetch(`${API_URL}/extra-contacts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al actualizar contacto');
    }
    return res.json();
  },

  // Delete a contact
  remove: async (id: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/extra-contacts/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al eliminar contacto');
    }
  },
};
