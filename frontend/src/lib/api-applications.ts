import { Application, ApplicationStats, ApplicationDocument } from '@/types/application';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// ====== APODERADO ENDPOINTS ======

// Crear nueva solicitud (borrador vacío)
export async function createApplication(token: string): Promise<Application> {
  const res = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al crear solicitud');
  }
  return res.json();
}

// Helper function to clean data before sending to API
function cleanApplicationData(data: Partial<Application>): Partial<Application> {
  // List of fields that should NOT be sent to the backend on update
  const readOnlyFields = [
    'id', 'status', 'submittedAt', 'userId', 'assignedToId', 'assignedAt',
    'processedById', 'processedAt', 'cursilloScheduled', 'cursilloDate',
    'cursilloResult', 'cursilloNotes', 'acceptedAt', 'adminNotes',
    'rejectionReason', 'correctionRequest', 'internalComments',
    'createdAt', 'updatedAt', 'documents', 'user', 'assignedParallel',
    'paymentDate', 'paymentReference', 'paymentAmount'
  ];

  const cleaned = { ...data };

  readOnlyFields.forEach(field => {
    // @ts-ignore
    delete cleaned[field];
  });

  // Ensure strict number types for validation
  if (cleaned.lastYearAverage !== undefined && cleaned.lastYearAverage !== null) {
    cleaned.lastYearAverage = Number(cleaned.lastYearAverage);
  }

  // Clean extraContacts array
  if (cleaned.extraContacts && Array.isArray(cleaned.extraContacts)) {
    cleaned.extraContacts = cleaned.extraContacts.map((contact: any) => {
      const { id, applicationId, createdAt, updatedAt, ...rest } = contact;
      return rest;
    });
  }

  return cleaned;
}

// Actualizar solicitud (autoguardado)
export async function updateApplication(
  token: string,
  id: string,
  data: Partial<Application>
): Promise<Application> {
  const cleanedData = cleanApplicationData(data);

  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cleanedData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al actualizar solicitud');
  }
  return res.json();
}

// Enviar solicitud
export async function submitApplication(token: string, id: string): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/${id}/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al enviar solicitud');
  }
  return res.json();
}

// Listar mis solicitudes
export async function getMyApplications(token: string): Promise<Application[]> {
  const res = await fetch(`${API_URL}/applications/my-applications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Error al obtener solicitudes');
  return res.json();
}

// Obtener mis estadísticas
export async function getMyStats(token: string): Promise<ApplicationStats> {
  const res = await fetch(`${API_URL}/applications/my-stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Error al obtener estadísticas');
  return res.json();
}

// Obtener detalle de solicitud
export async function getApplication(token: string, id: string): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al obtener solicitud');
  }
  return res.json();
}

// Eliminar solicitud (solo borrador)
export async function deleteApplication(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al eliminar solicitud');
  }
}

// ====== DOCUMENTOS ======

// Subir documento
export async function uploadDocument(
  token: string,
  applicationId: string,
  documentType: string,
  file: File
): Promise<ApplicationDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const res = await fetch(`${API_URL}/applications/${applicationId}/documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al subir documento');
  }
  return res.json();
}

// Listar documentos
export async function getDocuments(
  token: string,
  applicationId: string
): Promise<ApplicationDocument[]> {
  const res = await fetch(`${API_URL}/applications/${applicationId}/documents`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Error al obtener documentos');
  return res.json();
}

// Eliminar documento
export async function deleteDocument(
  token: string,
  applicationId: string,
  documentId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/applications/${applicationId}/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al eliminar documento');
  }
}

// Verificar cupos
export async function checkQuotaAvailability(
  token: string,
  gradeLevel: string,
  shift: string,
  specialty?: string,
  previousSchool?: string
) {
  const params = new URLSearchParams({ gradeLevel, shift });
  if (specialty) params.append('specialty', specialty);
  if (previousSchool) params.append('previousSchool', previousSchool);

  const res = await fetch(`${API_URL}/applications/check-quota?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al verificar cupos');
  return res.json();
}

// Obtener estadísticas globales (admin)
export async function getGlobalStats(token: string) {
  const res = await fetch(`${API_URL}/applications/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al obtener estadísticas globales');
  return res.json();
}

// ==== CURSILLOS ====

export async function scheduleCursillo(
  token: string,
  id: string,
  cursilloDate: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/cursillo-schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cursilloDate }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al programar cursillo');
  }
  return res.json();
}

export async function recordCursilloResult(
  token: string,
  id: string,
  result: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/cursillo-result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ result, notes }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al registrar resultado del cursillo');
  }
  return res.json();
}

export async function bulkApproveApplications(token: string, ids: string[]): Promise<any> {
  const res = await fetch(`${API_URL}/applications/admin/bulk/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Error al aprobar solicitudes en masa');
  return res.json();
}

export async function bulkRejectApplications(token: string, ids: string[], reason: string): Promise<any> {
  const res = await fetch(`${API_URL}/applications/admin/bulk/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ids, reason }),
  });
  if (!res.ok) throw new Error('Error al rechazar solicitudes en masa');
  return res.json();
}

export async function uploadPaymentDetails(
  token: string,
  id: string,
  paymentDate: string,
  paymentReference?: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/${id}/payment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ paymentDate, paymentReference }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al cargar detalles de pago');
  }
  return res.json();
}
