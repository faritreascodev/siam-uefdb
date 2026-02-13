import { RegisterFormValues } from "@/lib/schemas/register.schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export interface RegisterResponse {
  message: string;
  userId: string;
}

export async function registerUser(data: RegisterFormValues): Promise<RegisterResponse> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { confirmPassword, ...registerData } = data;
  
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registerData),
  });

  const responseData = await res.json();

  if (!res.ok) {
    // Backend throws HttpException, structure is often { statusCode, message, error }
    // message can be string or array of strings (class-validator)
    let errorMessage = 'Registration failed';
    if (responseData.message) {
      errorMessage = Array.isArray(responseData.message) 
        ? responseData.message.join(', ') 
        : responseData.message;
    }
    throw new Error(errorMessage);
  }

  return responseData;
}
