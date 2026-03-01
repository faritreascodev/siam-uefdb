const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getSystemConfigs(token: string) {
    const response = await fetch(`${API_URL}/system-config`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch system configurations');
    }

    return response.json();
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
