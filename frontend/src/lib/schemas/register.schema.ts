import { z } from "zod";
import { validateCedulaEcuatoriana } from "@/lib/validators/cedula";

export enum Parentesco {
  PADRE = 'PADRE',
  MADRE = 'MADRE',
  ABUELO_ABUELA = 'ABUELO_ABUELA',
  TIO_TIA = 'TIO_TIA',
  TUTOR_LEGAL = 'TUTOR_LEGAL',
}

export const registerSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  cedula: z.string().refine(validateCedulaEcuatoriana, {
    message: "Cédula inválida",
  }),
  telefono: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").optional().or(z.literal("")),
  direccion: z.string().optional(),
  confirmPassword: z.string().min(1, "Confirme su contraseña"),
  parentesco: z.nativeEnum(Parentesco).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
