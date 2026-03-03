import { Application, ApplicationStats } from '@/types/application';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

// Tipo para respuesta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filtros para listado de solicitudes
export interface ApplicationFilters {
  status?: string;
  gradeLevel?: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  specialty?: string;
  shift?: string;
  assignedToId?: string;
  processedById?: string;
  assignedParallel?: string;
}

// ====== ADMIN ENDPOINTS ======

// Listar todas las solicitudes (con paginación)
export async function getAllApplications(
  token: string,
  filters?: ApplicationFilters
): Promise<PaginatedResponse<Application>> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.specialty) params.append('specialty', filters.specialty);
  if (filters?.shift) params.append('shift', filters.shift);
  if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
  if (filters?.processedById) params.append('processedById', filters.processedById);
  if (filters?.assignedParallel) params.append('assignedParallel', filters.assignedParallel);

  const res = await fetch(`${API_URL}/applications/admin/all?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Error al obtener solicitudes');
  return res.json();
}

// Obtener estadísticas globales
export async function getGlobalStats(token: string): Promise<ApplicationStats> {
  const res = await fetch(`${API_URL}/applications/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Error al obtener estadísticas');
  return res.json();
}

// Obtener detalle de solicitud (admin)
export async function getApplicationDetail(token: string, id: string): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}`, {
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

// Poner en revisión
export async function putUnderReview(token: string, id: string): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al procesar');
  }
  return res.json();
}

// Solicitar correcciones
export async function requestCorrections(
  token: string,
  id: string,
  correctionRequest: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/request-correction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ correctionRequest }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al solicitar correcciones');
  }
  return res.json();
}

// Aprobar solicitud
export async function approveApplication(
  token: string,
  id: string,
  adminNotes?: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ adminNotes }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al aprobar');
  }
  return res.json();
}

// Rechazar solicitud
export async function rejectApplication(
  token: string,
  id: string,
  rejectionReason: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rejectionReason }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al rechazar');
  }
  return res.json();
}

// Asignar a directivo
export async function assignToDirectivo(
  token: string,
  id: string,
  directivoId: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ directivoId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al asignar');
  }
  return res.json();
}

// Agregar comentario interno
export async function addInternalComment(
  token: string,
  id: string,
  comment: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al agregar comentario');
  }
  return res.json();
}

// Obtener solicitudes asignadas (para directivos)
export async function getAssignedApplications(
  token: string,
  filters?: ApplicationFilters
): Promise<Application[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.specialty) params.append('specialty', filters.specialty);
  if (filters?.shift) params.append('shift', filters.shift);

  const res = await fetch(`${API_URL}/applications/directivo/assigned?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Error al obtener solicitudes asignadas');
  return res.json();
}

// Descargar PDF de solicitud — descarga directa en el navegador
export async function downloadApplicationPdf(
  token: string,
  id: string,
  studentName?: string,
  cedula?: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/reports/application/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al generar el PDF');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  // Nombre de archivo descriptivo
  const namePart = studentName
    ? studentName.replace(/\s+/g, '_').toUpperCase()
    : id.slice(0, 8).toUpperCase();
  const cedulaPart = cedula ? `_${cedula}` : '';
  const filename = `Ficha_Admision_${namePart}${cedulaPart}.pdf`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Obtener paralelos disponibles
export async function getAvailableParallels(token: string, id: string): Promise<{ parallel: string, available: number, totalQuota: number, used: number }[]> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/available-parallels`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al obtener paralelos');
  }
  return res.json();
}

// Asignar paralelo
export async function assignParallel(token: string, id: string, parallel: string): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/assign-parallel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ parallel }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al asignar paralelo');
  }
  return res.json();
} export async function bulkApproveApplications(token: string, ids: string[]): Promise<any> {
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

export async function validatePayment(
  token: string,
  id: string,
  isValid: boolean,
  reason?: string
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/admin/${id}/validate-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isValid, reason }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al validar pago');
  }
  return res.json();
}

// Eliminar solicitud (liberar cupo) — solo para REJECTED o CURSILLO_REJECTED
export async function adminRemoveApplication(token: string, id: string): Promise<{ message: string; id: string }> {
  const res = await fetch(`${API_URL}/applications/admin/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Error al eliminar solicitud');
  }
  return res.json();
}
