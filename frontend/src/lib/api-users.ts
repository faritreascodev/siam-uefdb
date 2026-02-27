import { User, CreateUserRequest, UpdateUserRequest } from '@/types/user';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

async function authHeader() {
  // Ideally use session or a stored token. 
  // For client components, we can use getSession or manage token in a context/store.
  // Note: getSession needs to be handled properly. 
  // If we are in a server component, we pass headers. 
  // For now assuming we are calling from client.
  
  // Actually, Shadcn/NextJS approach usually involves server actions or client fetch with token.
  // Let's rely on the session access token if available.
  // We'll implemented a helper to get the token.
  return {
    'Content-Type': 'application/json',
  };
}

// We will modify this to accept a token or assume middleware handles it?
// Usually accessing external backend requires the JWT.
// Let's assume we pass the token or retrieve it.
// For simplicitly, let's accept token as arg or use a hook.
// But standard fetch function is better.

export async function getRoles(token: string) {
  const res = await fetch(`${API_URL}/users/roles`, {
    headers: {
       Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch roles');
  return res.json();
}

export async function getUsers(token: string, role?: string): Promise<User[]> {
  const url = role ? `${API_URL}/users?role=${role}` : `${API_URL}/users`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

// Helper to handle response
async function handleResponse(res: Response, errorMessage: string) {
  if (!res.ok) {
    try {
      const error = await res.json();
      throw new Error(error.message || errorMessage);
    } catch (e: any) {
        // If parsing json fails or if header is not json
        // Check if we already threw the error with message
        if (e.message !== errorMessage && e.message) {
            throw e;
        }
        throw new Error(errorMessage);
    }
  }
  return res.json();
}

export async function createUser(token: string, data: CreateUserRequest): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to create user');
}

export async function updateUser(token: string, id: string, data: UpdateUserRequest): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to update user');
}

export async function toggleUserStatus(token: string, id: string, isActive: boolean): Promise<User> {
  const endpoint = isActive ? 'activate' : 'deactivate';
  const res = await fetch(`${API_URL}/users/${id}/${endpoint}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, `Failed to ${endpoint} user`);
}

export async function assignRole(token: string, userId: string, roleId: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/${userId}/roles/${roleId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, 'Failed to assign role');
}

export async function removeRole(token: string, userId: string, roleId: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/${userId}/roles/${roleId}`, {
    method: 'DELETE',
    headers: {
       Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(res, 'Failed to remove role');
}

export async function resetPassword(token: string, userId: string): Promise<{ message: string, tempPassword?: string }> {
  const res = await fetch(`${API_URL}/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to reset password');
  return res.json();
}
