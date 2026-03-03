const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getSystemConfigs(token: string) {
    try {
        const response = await fetch(`${API_URL}/system-config`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return []; // Return empty array silently - non-critical feature
        }

        return response.json();
    } catch {
        return []; // Network error - return empty, sidebar will use defaults
    }
}

export async function updateSystemConfig(token: string, key: string, value: string) {
    const response = await fetch(`${API_URL}/system-config/${key}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update system configuration');
    }

    return response.json();
}
