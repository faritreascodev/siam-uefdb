export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  cedula?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  roles: string[]; // Simplification: list of role names
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  cedula?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleNames?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  cedula?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}
