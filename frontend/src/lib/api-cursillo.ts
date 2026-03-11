const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============ SESIONES ============

export async function getCursilloSessions(token: string, academicYear?: string) {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const res = await fetch(`${API_URL}/cursillos/sessions${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener sesiones de cursillo');
    return res.json();
}

export async function getCursilloSession(token: string, id: string) {
    const res = await fetch(`${API_URL}/cursillos/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener sesión');
    return res.json();
}

export async function updateCursilloSession(token: string, id: string, data: {
    teacherName?: string;
    teacherEmail?: string;
    teamsLink?: string;
    startDate?: string;
    endDate?: string;
    totalSessions?: number;
    sessionSchedule?: string;
    isActive?: boolean;
    description?: string;
}) {
    const res = await fetch(`${API_URL}/cursillos/sessions/${id}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al actualizar sesión');
    }
    return res.json();
}

export async function notifyCursilloSessionEnrolled(token: string, id: string) {
    const res = await fetch(`${API_URL}/cursillos/sessions/${id}/notify-enrolled`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al notificar');
    }
    return res.json();
}

export async function createCursilloSession(token: string, data: {
    subject: string;
    subjectCode: string;
    gradeLevel: string;
    specialty?: string;
    teacherName?: string;
    teamsLink?: string;
    startDate?: string;
    endDate?: string;
    totalSessions?: number;
    sessionSchedule?: string;
    description?: string;
    academicYear?: string;
}) {
    const res = await fetch(`${API_URL}/cursillos/sessions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al crear sesión');
    }
    return res.json();
}

// ============ INSCRIPCIONES ============

export async function enrollApplicationInCursillo(token: string, applicationId: string, academicYear?: string) {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const res = await fetch(`${API_URL}/cursillos/applications/${applicationId}/enroll${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al inscribir en cursillo');
    }
    return res.json();
}

export async function getApplicationEnrollments(token: string, applicationId: string) {
    const res = await fetch(`${API_URL}/cursillos/applications/${applicationId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener inscripciones');
    return res.json();
}

/**
 * Endpoint para apoderado: retorna las inscripciones de SU propia solicitud.
 * El servidor valida la propiedad de la solicitud.
 */
export async function getMyApplicationEnrollments(token: string, applicationId: string) {
    const res = await fetch(`${API_URL}/cursillos/applications/${applicationId}/my-enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al obtener inscripciones del cursillo');
    }
    return res.json();
}

export async function updateCursilloEnrollment(token: string, enrollmentId: string, data: {
    attendedSessions: number;
    score?: number;
    notes?: string;
}) {
    const res = await fetch(`${API_URL}/cursillos/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al actualizar inscripción');
    }
    return res.json();
}

export async function finalizeCursillo(token: string, applicationId: string) {
    const res = await fetch(`${API_URL}/cursillos/applications/${applicationId}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al finalizar cursillo');
    }
    return res.json();
}

export async function removeApplicationFromCursillo(token: string, applicationId: string) {
    const res = await fetch(`${API_URL}/cursillos/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al eliminar solicitud');
    }
    return res.json();
}

// ============ ESTADÍSTICAS ============

export async function getCursilloStats(token: string, academicYear?: string) {
    const params = academicYear ? `?academicYear=${academicYear}` : '';
    const res = await fetch(`${API_URL}/cursillos/stats${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    return res.json();
}

// Alias para admin panel (nombre más claro)
export const getCursilloEnrollments = getApplicationEnrollments;
// Alias para portal de apoderado (usa el endpoint seguro /my-enrollments)
export const getCursilloEnrollmentsForApoderado = getMyApplicationEnrollments;
