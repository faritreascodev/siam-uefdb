const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getAuditLogs(token: string, params: {
    action?: string;
    entity?: string;
    userId?: string;
    page?: number;
    limit?: number;
} = {}) {
    const queryParams = new URLSearchParams();
    if (params.action) queryParams.append('action', params.action);
    if (params.entity) queryParams.append('entity', params.entity);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_URL}/audit?${queryParams.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
    }

    return response.json();
}
